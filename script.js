const DATA=window.PORTFOLIO_DATA||{home:[],projects:[],commercial:[]};
const views=[...document.querySelectorAll(".view")];
let currentView="home",previousView="project",heroIndex=0,currentLightImages=[],lightIndex=0,currentBrand=null;

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

function createFeed(container,items,onClick){
  container.innerHTML="";
  items.forEach((item,index)=>{
    if(!item.src)return;
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

const grouped={};
DATA.projects.forEach(project=>(grouped[project.group||"Projects"]??=[]).push(project));
const projectList=document.getElementById("projectList");
Object.entries(grouped).forEach(([group,projects])=>{
  const wrap=document.createElement("div");
  wrap.className="project-group";
  wrap.innerHTML=`<h3>${group}</h3>`;
  projects.forEach(project=>{
    const button=document.createElement("button");
    button.textContent=project.title;
    button.addEventListener("click",()=>openGallery(project.title,project.images,"project"));
    wrap.appendChild(button);
  });
  projectList.appendChild(wrap);
});

const projectFeedItems=DATA.projects
  .filter(p=>p.images.length)
  .map((project,index)=>({
    src:project.images[(index*3)%project.images.length],
    title:project.title,
    project
  }));
createFeed(document.getElementById("projectFeed"),projectFeedItems,item=>{
  openGallery(item.project.title,item.project.images,"project");
});

const commercialList=document.getElementById("commercialList");
const commercialFeedItems=[];
DATA.commercial.forEach(category=>{
  const categoryEl=document.createElement("div");
  categoryEl.className="commercial-category";
  categoryEl.innerHTML=`<h3>${category.title}</h3>`;
  category.brands.forEach(brand=>{
    const button=document.createElement("button");
    button.textContent=brand.title;
    button.addEventListener("click",()=>openBrand(category,brand));
    categoryEl.appendChild(button);
    brand.campaigns.forEach(campaign=>{
      if(campaign.images.length){
        commercialFeedItems.push({
          src:campaign.images[0],
          title:`${brand.title} — ${campaign.title}`,
          category,
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

function openBrand(category,brand){
  currentBrand={category,brand};
  document.getElementById("brandTitle").textContent=brand.title;
  document.getElementById("brandDescription").textContent=`Photography for ${brand.title}`;
  const campaignList=document.getElementById("campaignList");
  campaignList.innerHTML="";
  const brandFeedItems=[];
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
    campaign.images.forEach((src,index)=>{
      brandFeedItems.push({src,title:campaign.title,campaign,index});
    });
  });
  createFeed(document.getElementById("brandFeed"),brandFeedItems,item=>{
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
