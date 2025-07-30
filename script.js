const spanEL = document.querySelector("main h2 span");
const txtArr = ['This is Lee\'s space ','A heart that\'s full up like a landfill. ','Just \'cause you feel it doesn’t mean it’s there.']
let index =0;
let currentTxt = txtArr[index].split("");

function writeTxt(){
    spanEL.textContent+=currentTxt.shift();
    if(currentTxt.length!==0){
        setTimeout(writeTxt,Math.floor(Math.random()*100))
    }else{
        currentTxt=spanEL.textContent.split("");
        setTimeout(deleteTxt,3000);

    }
}
writeTxt();

function deleteTxt(){
    currentTxt.pop();
    spanEL.textContent=currentTxt.join("");
    if(currentTxt.length!==0){
        setTimeout(deleteTxt,Math.floor(Math.random()*100));

    }else{
        index=(index+1)%txtArr.length;
        currentTxt=txtArr[index].split("");
        writeTxt();
    }
}

const headerEl=document.querySelector("header");
window.addEventListener('scroll',function(){
    const browerScrollY=window.pageYOffset;
    if(browerScrollY>0){
        headerEl.classList.add("active");
    }else{
        headerEl.classList.remove("active");
    }
})

const animationMove=function(selector){
    const targetEl=document.querySelector(selector);
    const browerScrollY=window.pageYOffset;
    const targetScrollY=targetEl.getBoundingClientRect().top+browerScrollY
    window.scrollTo({top:targetScrollY,behavior: 'smooth'})
}

const scrollMoveEl = document.querySelectorAll("[data-animation-scroll='true']");
for(let i=0; i<scrollMoveEl.length; i++){
    scrollMoveEl[i].addEventListener('click',function(e){
        const target=this.dataset.target;
        animationMove(target);
    });
}