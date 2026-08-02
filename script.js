const DATA=window.PORTFOLIO_DATA||{home:[],projectSections:[],commercial:[]};
const views=[...document.querySelectorAll(".view")];
let currentView="home",previousView="project",heroIndex=0,currentLightImages=[],lightIndex=0;

function show(id){
  views.forEach(v=>v.classList.toggle("active",v.id===id));
  currentView=id;
  document.getElementById(id)?.scrollTo(0,0);
}
document.querySelectorAll("[data-route]").forEach(button=>{
  button.addEventListener("click",()=>show(button.dataset.route));
});

const heroImage=document.getElementById("heroImage");
function renderHero(){
  if(!DATA.home.length){
    heroImage.removeAttribute("src");
    document.getElementById("heroCount").textContent="";
    return;
  }
  const item=DATA.home[heroIndex];
  heroImage.style.opacity="0";
  setTimeout(()=>{
    heroImage.src=item.src;
    document.getElementById("heroTitle").textContent=item.title||"HOME";
    document.getElementById("heroCount").textContent=
      `${String(heroIndex+1).padStart(2,"0")} / ${String(DATA.home.length).padStart(2,"0")}`;
    heroImage.style.opacity="1";
  },120);
}
document.getElementById("prevHero").addEventListener("click",()=>{
  if(!DATA.home.length)return;
  heroIndex=(heroIndex-1+DATA.home.length)%DATA.home.length;
  renderHero();
});
document.getElementById("nextHero").addEventListener("click",()=>{
  if(!DATA.home.length)return;
  heroIndex=(heroIndex+1)%DATA.home.length;
  renderHero();
});

function flattenImages(node){
  return [
    ...(node.images||[]),
    ...(node.children||[]).flatMap(flattenImages)
  ];
}
function createFeed(container,items,onClick){
  container.innerHTML="";
  items.filter(item=>item.src).forEach((item,index)=>{
    const figure=document.createElement("figure");
    figure.className="feed-item";
    const image=document.createElement("img");
    image.src=item.src;
    image.loading="lazy";
    image.alt=item.title||"";
    figure.addEventListener("click",()=>onClick(item,index));
    figure.appendChild(image);
    container.appendChild(figure);
  });
}

const projectList=document.getElementById("projectList");
const projectFeedItems=[];
DATA.projectSections.forEach(section=>{
  const sectionEl=document.createElement("div");
  sectionEl.className="project-group";
  sectionEl.innerHTML=`<h3>${section.title}</h3>`;

  if(!section.items.length){
    const empty=document.createElement("span");
    empty.className="empty-message";
    empty.textContent="Projects will be added later.";
    sectionEl.appendChild(empty);
  }

  section.items.forEach(item=>{
    const button=document.createElement("button");
    button.textContent=item.title;
    button.addEventListener("click",()=>{
      if(item.children?.length) openCollection(item,section.title);
      else openGallery(item.title,item.images||[],"project");
    });
    sectionEl.appendChild(button);

    const images=flattenImages(item);
    if(images.length){
      projectFeedItems.push({
        src:images[0],
        title:item.title,
        item,
        sectionTitle:section.title
      });
    }
  });
  projectList.appendChild(sectionEl);
});
createFeed(document.getElementById("projectFeed"),projectFeedItems,item=>{
  if(item.item.children?.length) openCollection(item.item,item.sectionTitle);
  else openGallery(item.item.title,item.item.images||[],"project");
});

function openCollection(item,sectionTitle){
  document.getElementById("collectionTitle").textContent=item.title;
  const list=document.getElementById("collectionList");
  list.innerHTML="";
  const feedItems=[];

  item.children.forEach(child=>{
    const button=document.createElement("button");
    button.textContent=child.title;
    button.addEventListener("click",()=>{
      if(child.children?.length) openCollection(child,item.title);
      else openGallery(child.title,child.images||[],"collection");
    });
    list.appendChild(button);
    const images=flattenImages(child);
    if(images.length){
      feedItems.push({src:images[0],title:child.title,child});
    }
  });

  createFeed(document.getElementById("collectionFeed"),feedItems,feedItem=>{
    if(feedItem.child.children?.length) openCollection(feedItem.child,item.title);
    else openGallery(feedItem.child.title,feedItem.child.images||[],"collection");
  });
  show("collection");
}
document.getElementById("collectionBack").addEventListener("click",()=>show("project"));

const commercialList=document.getElementById("commercialList");
const commercialFeedItems=[];
DATA.commercial.forEach(category=>{
  const categoryEl=document.createElement("div");
  categoryEl.className="commercial-category";
  categoryEl.innerHTML=`<h3>${category.title}</h3>`;
  category.brands.forEach(brand=>{
    const button=document.createElement("button");
    button.textContent=brand.title;
    button.addEventListener("click",()=>openBrand(brand));
    categoryEl.appendChild(button);
    brand.campaigns.forEach(campaign=>{
      if(campaign.images.length){
        commercialFeedItems.push({
          src:campaign.images[0],
          title:`${brand.title} — ${campaign.title}`,
          brand,
          campaign
        });
      }
    });
  });
  commercialList.appendChild(categoryEl);
});
createFeed(document.getElementById("commercialFeed"),commercialFeedItems,item=>{
  openGallery(`${item.brand.title} — ${item.campaign.title}`,item.campaign.images,"commercial");
});

function openBrand(brand){
  document.getElementById("brandTitle").textContent=brand.title;
  document.getElementById("brandDescription").textContent=`Photography for ${brand.title}`;
  const campaignList=document.getElementById("campaignList");
  campaignList.innerHTML="";
  const feedItems=[];

  if(!brand.campaigns.length){
    campaignList.innerHTML='<span class="empty-message">Campaign folders will appear here.</span>';
  }
  brand.campaigns.forEach(campaign=>{
    const button=document.createElement("button");
    button.textContent=campaign.title;
    button.addEventListener("click",()=>openGallery(
      `${brand.title} — ${campaign.title}`,
      campaign.images,
      "brand"
    ));
    campaignList.appendChild(button);
    campaign.images.forEach(src=>feedItems.push({src,title:campaign.title,campaign}));
  });
  createFeed(document.getElementById("brandFeed"),feedItems,item=>{
    openGallery(`${brand.title} — ${item.campaign.title}`,item.campaign.images,"brand");
  });
  show("brand");
}
document.getElementById("brandBack").addEventListener("click",()=>show("commercial"));

function openGallery(title,images,from){
  previousView=from;
  document.getElementById("detailTitle").textContent=title;
  const gallery=document.getElementById("detailGallery");
  gallery.innerHTML="";
  if(!images.length){
    gallery.innerHTML='<div class="empty-message">Images will be added later.</div>';
  }
  images.forEach((src,index)=>{
    const holder=document.createElement("div");
    holder.className="detail-image";
    const image=document.createElement("img");
    image.src=src;
    image.loading="lazy";
    image.alt=`${title} ${index+1}`;
    image.addEventListener("click",()=>openLightbox(images,index));
    holder.appendChild(image);
    gallery.appendChild(holder);
  });
  show("detail");
}
document.getElementById("backBtn").addEventListener("click",()=>show(previousView));

const lightbox=document.getElementById("lightbox");
const lightboxStage=document.getElementById("lightboxStage");
function openLightbox(images,index){
  currentLightImages=images;
  lightIndex=index;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden","false");
  renderLight();
}
function renderLight(){
  document.getElementById("lightImage").src=currentLightImages[lightIndex];
  document.getElementById("lightCounter").textContent=`${lightIndex+1} / ${currentLightImages.length}`;
}
function closeLightbox(){
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden","true");
  document.getElementById("lightImage").removeAttribute("src");
}
document.getElementById("closeLightbox").addEventListener("click",event=>{
  event.stopPropagation();
  closeLightbox();
});
lightbox.addEventListener("click",event=>{
  if(event.target===lightbox||event.target===lightboxStage)closeLightbox();
});
document.getElementById("lightPrev").addEventListener("click",event=>{
  event.stopPropagation();
  lightIndex=(lightIndex-1+currentLightImages.length)%currentLightImages.length;
  renderLight();
});
document.getElementById("lightNext").addEventListener("click",event=>{
  event.stopPropagation();
  lightIndex=(lightIndex+1)%currentLightImages.length;
  renderLight();
});
document.getElementById("lightImage").addEventListener("click",event=>event.stopPropagation());

document.addEventListener("keydown",event=>{
  if(lightbox.classList.contains("open")){
    if(event.key==="Escape")closeLightbox();
    if(event.key==="ArrowLeft")document.getElementById("lightPrev").click();
    if(event.key==="ArrowRight")document.getElementById("lightNext").click();
    return;
  }
  if(currentView==="home"){
    if(event.key==="ArrowLeft")document.getElementById("prevHero").click();
    if(event.key==="ArrowRight")document.getElementById("nextHero").click();
  }
  if(event.key==="Escape"&&currentView==="detail")show(previousView);
});
renderHero();
