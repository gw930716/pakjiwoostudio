const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMAGES = path.join(ROOT, "images");
const DIST = path.join(ROOT, "dist");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
function readMeta(dir, fallback = {}) {
  const metaPath = path.join(dir, "_meta.json");
  if (!fs.existsSync(metaPath)) return fallback;
  try {
    return { ...fallback, ...JSON.parse(fs.readFileSync(metaPath, "utf8")) };
  } catch {
    return fallback;
  }
}
function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => item.isDirectory() && !item.name.startsWith("."))
    .map(item => item.name)
    .filter(name => {
      const meta = readMeta(path.join(dir, name), {});
      return meta.hidden !== true;
    });
}
function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => item.isFile() && IMAGE_EXT.has(path.extname(item.name).toLowerCase()))
    .map(item => item.name)
    .sort(naturalSort);
}
function titleFromSlug(slug) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function sortByMeta(root, slugs) {
  return slugs.sort((a, b) => {
    const ma = readMeta(path.join(root, a), {});
    const mb = readMeta(path.join(root, b), {});
    const oa = Number.isFinite(ma.order) ? ma.order : 9999;
    const ob = Number.isFinite(mb.order) ? mb.order : 9999;
    return oa - ob || naturalSort(ma.title || a, mb.title || b);
  });
}
function webPath(...parts) {
  return parts.join("/").replaceAll(path.sep, "/");
}
function copyRecursive(source, target) {
  if (fs.existsSync(source)) fs.cpSync(source, target, { recursive: true });
}

function scanHome() {
  const dir = path.join(IMAGES, "home");
  return listImages(dir).map(file => ({
    src: webPath("images", "home", file),
    title: "HOME"
  }));
}

function scanProjectNode(dir, webParts, slug) {
  const meta = readMeta(dir, { title: titleFromSlug(slug) });
  const images = listImages(dir).map(file => webPath("images", ...webParts, file));
  const childSlugs = sortByMeta(dir, listDirs(dir));
  const children = childSlugs.map(childSlug =>
    scanProjectNode(path.join(dir, childSlug), [...webParts, childSlug], childSlug)
  );
  return {
    slug,
    title: meta.title,
    order: meta.order ?? 9999,
    images,
    children
  };
}

function scanProjectSections() {
  const root = path.join(IMAGES, "project");
  return sortByMeta(root, listDirs(root)).map(sectionSlug => {
    const sectionDir = path.join(root, sectionSlug);
    const sectionMeta = readMeta(sectionDir, { title: titleFromSlug(sectionSlug) });
    return {
      slug: sectionSlug,
      title: sectionMeta.title,
      order: sectionMeta.order ?? 9999,
      items: sortByMeta(sectionDir, listDirs(sectionDir)).map(itemSlug =>
        scanProjectNode(
          path.join(sectionDir, itemSlug),
          ["project", sectionSlug, itemSlug],
          itemSlug
        )
      )
    };
  });
}

function scanCommercial() {
  const root = path.join(IMAGES, "commercial");
  return sortByMeta(root, listDirs(root)).map(categorySlug => {
    const categoryDir = path.join(root, categorySlug);
    const categoryMeta = readMeta(categoryDir, { title: titleFromSlug(categorySlug) });
    return {
      slug: categorySlug,
      title: categoryMeta.title,
      order: categoryMeta.order ?? 9999,
      brands: sortByMeta(categoryDir, listDirs(categoryDir)).map(brandSlug => {
        const brandDir = path.join(categoryDir, brandSlug);
        const brandMeta = readMeta(brandDir, { title: titleFromSlug(brandSlug) });
        const directImages = listImages(brandDir).map(file =>
          webPath("images", "commercial", categorySlug, brandSlug, file)
        );
        const nestedCampaigns = sortByMeta(brandDir, listDirs(brandDir)).map(campaignSlug => {
          const campaignDir = path.join(brandDir, campaignSlug);
          const campaignMeta = readMeta(campaignDir, { title: titleFromSlug(campaignSlug) });
          return {
            slug: campaignSlug,
            title: campaignMeta.title,
            images: listImages(campaignDir).map(file =>
              webPath("images", "commercial", categorySlug, brandSlug, campaignSlug, file)
            )
          };
        });
        const campaigns = [];
        if (directImages.length) {
          campaigns.push({
            slug: "_direct",
            title: brandMeta.directTitle || brandMeta.title,
            images: directImages,
            direct: true
          });
        }
        campaigns.push(...nestedCampaigns);
        return {
          slug: brandSlug,
          title: brandMeta.title,
          campaigns
        };
      })
    };
  });
}

cleanDist();
const data = {
  home: scanHome(),
  projectSections: scanProjectSections(),
  commercial: scanCommercial()
};
fs.writeFileSync(
  path.join(DIST, "data.js"),
  `window.PORTFOLIO_DATA = ${JSON.stringify(data, null, 2)};\n`,
  "utf8"
);
for (const file of ["index.html", "styles.css", "script.js"]) {
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
}
copyRecursive(IMAGES, path.join(DIST, "images"));

console.log(`Home images: ${data.home.length}`);
console.log(`Project sections: ${data.projectSections.length}`);
console.log(`Commercial categories: ${data.commercial.length}`);
