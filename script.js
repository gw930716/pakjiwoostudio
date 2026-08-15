const DATA=window.PORTFOLIO_DATA||{home:[],projectSections:[],commercial:[]};
const views=[...document.querySelectorAll(".view")];
let currentView="home",previousView="project",heroIndex=0,currentLightImages=[],lightIndex=0;

function show(id){
  views.forEach(v=>v.classList.toggle("active",v.id===id));
  currentView=id;
  document.getElementById(id)?.scrollTo(0,0);
  if(id==="home")startHeroAutoplay();
  else stopHeroAutoplay();
}
document.querySelectorAll("[data-route]").forEach(button=>{
  button.addEventListener("click",()=>show(button.dataset.route));
});

const heroTrack=document.getElementById("heroTrack");
const heroImageA=document.getElementById("heroImageA");
const heroImageB=document.getElementById("heroImageB");
const HERO_INTERVAL=2000;
const HERO_DURATION=720;
let heroTimer=null;
let heroAnimating=false;
let heroTouchStartX=null;

function updateHeroCaption(){
  if(!DATA.home.length){
    document.getElementById("heroCount").textContent="";
    return;
  }
  const item=DATA.home[heroIndex];
  document.getElementById("heroTitle").textContent=item.title||"HOME";
  document.getElementById("heroCount").textContent=
    `${String(heroIndex+1).padStart(2,"0")} / ${String(DATA.home.length).padStart(2,"0")}`;
}
function preloadHero(index){
  return new Promise(resolve=>{
    if(!DATA.home.length){resolve();return;}
    const img=new Image();
    img.onload=resolve;
    img.onerror=resolve;
    img.src=DATA.home[index].src;
  });
}
function resetHeroTrack(){
  heroTrack.classList.remove("animating");
  heroTrack.style.transform="translate3d(0,0,0)";
}
function renderInitialHero(){
  if(!DATA.home.length){
    heroImageA.removeAttribute("src");
    heroImageB.removeAttribute("src");
    updateHeroCaption();
    return;
  }
  heroImageA.src=DATA.home[heroIndex].src;
  heroImageB.src=DATA.home[(heroIndex+1)%DATA.home.length].src;
  resetHeroTrack();
  updateHeroCaption();
}
async function moveHero(direction=1,userInitiated=false){
  if(heroAnimating||DATA.home.length<2)return;
  heroAnimating=true;
  const nextIndex=(heroIndex+direction+DATA.home.length)%DATA.home.length;
  await preloadHero(nextIndex);

  if(direction>0){
    heroImageB.src=DATA.home[nextIndex].src;
    heroTrack.classList.add("animating");
    requestAnimationFrame(()=>heroTrack.style.transform="translate3d(-50%,0,0)");
  }else{
    heroImageB.src=DATA.home[nextIndex].src;
    heroTrack.classList.remove("animating");
    heroTrack.style.transform="translate3d(-50%,0,0)";
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      heroTrack.classList.add("animating");
      heroTrack.style.transform="translate3d(0,0,0)";
    }));
  }

  window.setTimeout(()=>{
    heroIndex=nextIndex;
    heroImageA.src=DATA.home[heroIndex].src;
    heroImageB.src=DATA.home[(heroIndex+1)%DATA.home.length].src;
    resetHeroTrack();
    updateHeroCaption();
    heroAnimating=false;
  },HERO_DURATION+30);

  if(userInitiated)restartHeroAutoplay();
}
function startHeroAutoplay(){
  stopHeroAutoplay();
  if(DATA.home.length>1){
    heroTimer=window.setInterval(()=>{
      if(currentView==="home"&&!document.hidden)moveHero(1,false);
    },HERO_INTERVAL);
  }
}
function stopHeroAutoplay(){
  if(heroTimer){
    window.clearInterval(heroTimer);
    heroTimer=null;
  }
}
function restartHeroAutoplay(){startHeroAutoplay();}

document.getElementById("prevHero").addEventListener("click",()=>moveHero(-1,true));
document.getElementById("nextHero").addEventListener("click",()=>moveHero(1,true));

const heroViewport=document.getElementById("heroViewport");
heroViewport.addEventListener("touchstart",event=>{
  heroTouchStartX=event.changedTouches[0].clientX;
},{passive:true});
heroViewport.addEventListener("touchend",event=>{
  if(heroTouchStartX===null)return;
  const delta=event.changedTouches[0].clientX-heroTouchStartX;
  heroTouchStartX=null;
  if(Math.abs(delta)>40)moveHero(delta<0?1:-1,true);
},{passive:true});

document.addEventListener("visibilitychange",()=>{
  if(document.hidden)stopHeroAutoplay();
  else if(currentView==="home")startHeroAutoplay();
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
    figure.className=`feed-item feed-layout-${(index%8)+1}`;
    const image=document.createElement("img");
    image.src=item.src;
    image.loading="lazy";
    image.alt=item.title||"";
    image.addEventListener("load",()=>{
      figure.classList.remove("is-landscape","is-portrait","is-squareish");
      const ratio=image.naturalWidth/image.naturalHeight;
      if(ratio>1.18){
        figure.classList.add("is-landscape");
      }else if(ratio<0.88){
        figure.classList.add("is-portrait");
      }else{
        figure.classList.add("is-squareish");
      }
    });
    figure.addEventListener("click",()=>onClick(item,index));
    figure.appendChild(image);
    if(item.title){
      const caption=document.createElement("figcaption");
      caption.className="feed-caption";
      caption.textContent=item.title;
      figure.appendChild(caption);
    }
    container.appendChild(figure);
  });
}

const projectList=document.getElementById("projectList");
const projectFeedItems=[];
function collectProjectLeafFeed(node,sectionTitle,parentTitles=[]){
  const pathTitles=[...parentTitles,node.title];
  const children=node.children||[];
  if(children.length){
    children.forEach(child=>collectProjectLeafFeed(child,sectionTitle,pathTitles));
    return;
  }
  if((node.images||[]).length){
    projectFeedItems.push({src:node.images[0],title:pathTitles.join(" — "),item:node,sectionTitle});
  }
}
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
    collectProjectLeafFeed(item,section.title);
  });
  projectList.appendChild(sectionEl);
});
createFeed(document.getElementById("projectFeed"),projectFeedItems,item=>{
  openGallery(item.item.title,item.item.images||[],"project");
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
      const isSpotify=String(brand.title||"").trim().toLowerCase()==="spotify";
      const showInCommercialFeed=!isSpotify;
      if(showInCommercialFeed && campaign.images.length){
        commercialFeedItems.push({
          src:campaign.images[0],
          title:campaign.direct?brand.title:`${brand.title} — ${campaign.title}`,
          brand,
          campaign
        });
      }
    });
  });
  commercialList.appendChild(categoryEl);
});
// Commercial feed: manually prioritized recent-work brands first.
// Brands not listed here keep their existing relative order afterwards.
const commercialFeedPriority=[
  "topten",
  "descente",
  "marithe",
  "neev",
  "unanswered mystery",
  "ovrl"
];

const normalizeCommercialBrand=value=>
  String(value||"").trim().toLowerCase().replace(/[\s\-_/]+/g,"");

commercialFeedItems.sort((a,b)=>{
  const aKey=normalizeCommercialBrand(a.brand?.title);
  const bKey=normalizeCommercialBrand(b.brand?.title);
  const aRank=commercialFeedPriority.findIndex(name=>aKey===normalizeCommercialBrand(name));
  const bRank=commercialFeedPriority.findIndex(name=>bKey===normalizeCommercialBrand(name));
  const safeARank=aRank===-1?Number.MAX_SAFE_INTEGER:aRank;
  const safeBRank=bRank===-1?Number.MAX_SAFE_INTEGER:bRank;
  return safeARank-safeBRank;
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
    campaign.images.forEach((src,imageIndex)=>feedItems.push({
      src,
      title:campaign.title,
      campaign,
      imageIndex
    }));
  });
  createFeed(document.getElementById("brandFeed"),feedItems,item=>{
    openGallery(
      `${brand.title} — ${item.campaign.title}`,
      item.campaign.images,
      "brand",
      item.imageIndex
    );
  });
  show("brand");
}
document.getElementById("brandBack").addEventListener("click",()=>show("commercial"));

let campaignViewerState=null;

function padCounter(value){
  return String(value).padStart(2,"0");
}

function renderCampaignViewer(){
  if(!campaignViewerState)return;
  const {images}=campaignViewerState;
  const index=campaignViewerState.index;
  const mainImage=document.getElementById("campaignMainImage");
  const counter=document.getElementById("campaignCounter");
  if(mainImage)mainImage.src=images[index]||"";
  if(counter)counter.textContent=`${padCounter(index+1)}  —  ${padCounter(images.length)}`;

  document.querySelectorAll(".campaign-thumb").forEach((thumb,thumbIndex)=>{
    thumb.classList.toggle("active",thumbIndex===index);
    if(thumbIndex===index){
      thumb.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
    }
  });
}

function moveCampaignViewer(direction){
  if(!campaignViewerState?.images?.length)return;
  const total=campaignViewerState.images.length;
  campaignViewerState.index=(campaignViewerState.index+direction+total)%total;
  renderCampaignViewer();
}

function buildCampaignViewer(title,images,startIndex=0){
  const gallery=document.getElementById("detailGallery");
  gallery.innerHTML="";
  document.getElementById("detail").classList.add("campaign-viewer-mode");

  const safeIndex=Math.max(0,Math.min(startIndex,Math.max(images.length-1,0)));
  campaignViewerState={title,images,index:safeIndex,viewAll:false};

  if(!images.length){
    gallery.innerHTML='<div class="empty-message">Images will be added later.</div>';
    return;
  }

  const viewer=document.createElement("div");
  viewer.className="campaign-viewer";

  const viewAll=document.createElement("button");
  viewAll.className="campaign-view-all";
  viewAll.textContent="VIEW ALL";

  const stage=document.createElement("div");
  stage.className="campaign-stage";

  const prev=document.createElement("button");
  prev.className="campaign-nav campaign-prev";
  prev.setAttribute("aria-label","Previous image");
  prev.textContent="‹";

  const next=document.createElement("button");
  next.className="campaign-nav campaign-next";
  next.setAttribute("aria-label","Next image");
  next.textContent="›";

  const mainImage=document.createElement("img");
  mainImage.id="campaignMainImage";
  mainImage.className="campaign-main-image";
  mainImage.alt=title;
  mainImage.addEventListener("click",()=>{
    if(campaignViewerState)openLightbox(images,campaignViewerState.index);
  });

  stage.append(prev,mainImage,next);

  const counter=document.createElement("div");
  counter.id="campaignCounter";
  counter.className="campaign-counter";

  const thumbs=document.createElement("div");
  thumbs.className="campaign-thumbs";
  images.forEach((src,index)=>{
    const button=document.createElement("button");
    button.className="campaign-thumb";
    button.setAttribute("aria-label",`View image ${index+1}`);
    const image=document.createElement("img");
    image.src=src;
    image.loading="lazy";
    image.alt=`${title} thumbnail ${index+1}`;
    button.appendChild(image);
    button.addEventListener("click",()=>{
      campaignViewerState.index=index;
      renderCampaignViewer();
    });
    thumbs.appendChild(button);
  });

  const allGrid=document.createElement("div");
  allGrid.className="campaign-all-grid";
  images.forEach((src,index)=>{
    const button=document.createElement("button");
    button.className="campaign-all-item";
    const image=document.createElement("img");
    image.src=src;
    image.loading="lazy";
    image.alt=`${title} ${index+1}`;
    button.appendChild(image);
    button.addEventListener("click",()=>{
      campaignViewerState.index=index;
      viewer.classList.remove("show-all");
      viewAll.textContent="VIEW ALL";
      campaignViewerState.viewAll=false;
      renderCampaignViewer();
    });
    allGrid.appendChild(button);
  });

  prev.addEventListener("click",()=>moveCampaignViewer(-1));
  next.addEventListener("click",()=>moveCampaignViewer(1));

  viewAll.addEventListener("click",()=>{
    campaignViewerState.viewAll=!campaignViewerState.viewAll;
    viewer.classList.toggle("show-all",campaignViewerState.viewAll);
    viewAll.textContent=campaignViewerState.viewAll?"CLOSE":"VIEW ALL";
  });

  let touchStartX=null;
  stage.addEventListener("touchstart",event=>{
    touchStartX=event.changedTouches[0].clientX;
  },{passive:true});
  stage.addEventListener("touchend",event=>{
    if(touchStartX===null)return;
    const delta=event.changedTouches[0].clientX-touchStartX;
    touchStartX=null;
    if(Math.abs(delta)>38)moveCampaignViewer(delta<0?1:-1);
  },{passive:true});

  viewer.append(viewAll,stage,counter,thumbs,allGrid);
  gallery.appendChild(viewer);
  renderCampaignViewer();
}

function buildScrollGallery(title,images,startIndex=0){
  const gallery=document.getElementById("detailGallery");
  gallery.innerHTML="";
  document.getElementById("detail").classList.remove("campaign-viewer-mode");
  campaignViewerState=null;

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

  const safeIndex=Math.max(0,Math.min(startIndex,images.length-1));
  if(images.length && safeIndex>0){
    const target=gallery.children[safeIndex];
    if(target){
      target.style.scrollMarginTop="64px";
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        target.scrollIntoView({block:"start",behavior:"auto"});
      }));
    }
  }
}

function openGallery(title,images,from,startIndex=0){
  previousView=from;
  const backLabels={
    project:"← PROJECT",
    commercial:"← COMMERCIAL",
    brand:"← BRAND",
    collection:"← PROJECT"
  };
  document.getElementById("backBtn").textContent=backLabels[from]||"← BACK";
  document.getElementById("detailTitle").textContent=title;

  const useCampaignViewer=from==="brand" || from==="commercial";
  if(useCampaignViewer){
    buildCampaignViewer(title,images,startIndex);
  }else{
    buildScrollGallery(title,images,startIndex);
  }
  show("detail");
}
document.getElementById("backBtn").addEventListener("click",()=>{
  document.getElementById("detail").classList.remove("campaign-viewer-mode");
  campaignViewerState=null;
  show(previousView);
});

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
  if(currentView==="detail" && campaignViewerState){
    if(event.key==="ArrowLeft")moveCampaignViewer(-1);
    if(event.key==="ArrowRight")moveCampaignViewer(1);
    if(event.key==="Escape"){
      if(campaignViewerState.viewAll){
        document.querySelector(".campaign-viewer")?.classList.remove("show-all");
        const viewAllButton=document.querySelector(".campaign-view-all");
        if(viewAllButton)viewAllButton.textContent="VIEW ALL";
        campaignViewerState.viewAll=false;
      }else{
        show(previousView);
      }
    }
    return;
  }
  if(currentView==="home"){
    if(event.key==="ArrowLeft")moveHero(-1,true);
    if(event.key==="ArrowRight")moveHero(1,true);
  }
  if(event.key==="Escape"&&currentView==="detail")show(previousView);
});
renderInitialHero();
startHeroAutoplay();
