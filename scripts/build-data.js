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

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => item.isDirectory() && !item.name.startsWith("."))
    .map(item => item.name)
    .sort(naturalSort);
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => item.isFile() && IMAGE_EXT.has(path.extname(item.name).toLowerCase()))
    .map(item => item.name)
    .sort(naturalSort);
}

function readMeta(dir, fallback) {
  const metaPath = path.join(dir, "_meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      return { ...fallback, ...data };
    } catch (error) {
      console.warn(`Invalid metadata: ${metaPath}`);
    }
  }
  return fallback;
}

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function webPath(...parts) {
  return parts.join("/").replaceAll(path.sep, "/");
}

function scanHome() {
  const dir = path.join(IMAGES, "home");
  return listImages(dir).map(file => ({
    src: webPath("images", "home", file),
    title: "HOME",
  }));
}

function scanProjects() {
  const root = path.join(IMAGES, "project");
  return listDirs(root).map(slug => {
    const dir = path.join(root, slug);
    const meta = readMeta(dir, { title: titleFromSlug(slug), group: "Projects" });
    return {
      slug,
      title: meta.title,
      group: meta.group || "Projects",
      images: listImages(dir).map(file => webPath("images", "project", slug, file)),
    };
  });
}

function scanCommercial() {
  const root = path.join(IMAGES, "commercial");
  return listDirs(root).map(categorySlug => {
    const categoryDir = path.join(root, categorySlug);
    const categoryMeta = readMeta(categoryDir, { title: titleFromSlug(categorySlug) });

    const brands = listDirs(categoryDir).map(brandSlug => {
      const brandDir = path.join(categoryDir, brandSlug);
      const brandMeta = readMeta(brandDir, { title: titleFromSlug(brandSlug) });

      const campaigns = listDirs(brandDir).map(campaignSlug => {
        const campaignDir = path.join(brandDir, campaignSlug);
        const campaignMeta = readMeta(campaignDir, { title: titleFromSlug(campaignSlug) });
        return {
          slug: campaignSlug,
          title: campaignMeta.title,
          images: listImages(campaignDir).map(file =>
            webPath("images", "commercial", categorySlug, brandSlug, campaignSlug, file)
          ),
        };
      });

      return {
        slug: brandSlug,
        title: brandMeta.title,
        campaigns,
      };
    });

    return {
      slug: categorySlug,
      title: categoryMeta.title,
      brands,
    };
  });
}

function copyRecursive(source, target) {
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, target, { recursive: true });
}

cleanDist();

const data = {
  home: scanHome(),
  projects: scanProjects(),
  commercial: scanCommercial(),
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
console.log(`Projects: ${data.projects.length}`);
console.log(`Commercial categories: ${data.commercial.length}`);
