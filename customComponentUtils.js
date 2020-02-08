function showCustomDialog(identifier,title,htmlToInsert,closeButtonText=undefined,onReady=undefined,width="25vw",minWidth="400px") {


	let customDialoContainerButton = document.querySelector(`#${identifier}`);

	if (customDialoContainerButton != undefined) {
		customDialoContainerButton.remove();
	}

	let buttonCode='';

	if (closeButtonText!=undefined){
		buttonCode	=`<button onclick="closeCustomDialog('${identifier}')" 
				 class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" style="margin-top:10px;width:100%" >${closeButtonText}</button> `;

	}
	customDialoContainerButton = $(` <dialog class="mdl-dialog" id='${identifier}' style="width:${width}; min-width:${minWidth}">
   				<h4 class="mdl-dialog__title">${title}</h4>
				<div class="mdl-dialog__content" style="padding:0px;margin:0px">
				
					${htmlToInsert}
				
			
				</div>
				 <div class="mdl-dialog__actions">
				 	${buttonCode} 
				 </div>
			</dialog>`);



	$("body").append(customDialoContainerButton);
	componentHandler.upgradeDom();
	customDialoContainerButton = document.querySelector(`#${identifier}`);


	if (!customDialoContainerButton.showModal) {
		dialogPolyfill.registerDialog(customDialoContainerButton);
	}

	customDialoContainerButton.showModal();
	if (onReady!=undefined){
		onReady();
	}


}

function closeCustomDialog(identifier) {
	let customContainer = document.querySelector(`#${identifier}`);
	if (customContainer != undefined) {
		customContainer.close();
	}
}

function showInfoModal(text,icon=undefined,iconColor=undefined,hideAfter=undefined) {
	remoteMeInfoModal= document.querySelector('#remoteMeInfoModal');

	if (remoteMeInfoModal==undefined){
		remoteMeInfoModal = $(` <dialog class="mdl-dialog" id="remoteMeInfoModal">
				<div class="mdl-dialog__content" style="padding:0px;margin:0px">
					<i class="icon"></i><h6 style="margin-top: 5px;">...</h6>
					<div style="clear: both"></div>
				</div>
			</dialog>`);

		$("body").append(remoteMeInfoModal);
		componentHandler.upgradeDom();
		remoteMeInfoModal= document.querySelector('#remoteMeInfoModal');
	}

	if (icon!=undefined){
		$(remoteMeInfoModal.querySelector(".icon")).attr('class','icon '+icon);
		$(remoteMeInfoModal.querySelector(".icon")).css("display",'inline');
		if (iconColor){
			$(remoteMeInfoModal.querySelector(".icon")).css("color",iconColor);
		}else{
			$(remoteMeInfoModal.querySelector(".icon")).css("color","#4c9ad6");
		}
		$(remoteMeInfoModal.querySelector("h6")).css("width","calc(100% - 52px)");
	}else{
		$(remoteMeInfoModal.querySelector(".icon")).css("display","none");
		$(remoteMeInfoModal.querySelector("h6")).css("width","100%");
	}

	if (! remoteMeInfoModal.showModal) {
		dialogPolyfill.registerDialog(remoteMeInfoModal);
	}


	if (remoteMeInfoModal.hideTimeOut!=undefined){
		clearTimeout(remoteMeInfoModal.hideTimeOut);
		remoteMeInfoModal.hideTimeOut=undefined;
	}
	if (hideAfter){
		remoteMeInfoModal.hideTimeOut=setTimeout(()=>closeInfoModal(), hideAfter*1000);
	}

	$(remoteMeInfoModal.querySelector("h6")).html(text);
	if (!remoteMeLoadingModal.hasAttribute("open")){
		remoteMeInfoModal.showModal();
	}


}
function closeInfoModal() {
	remoteMeInfoModal= document.querySelector('#remoteMeInfoModal');
	if (remoteMeInfoModal!=undefined){
		remoteMeInfoModal.close();
	}
}

function showProgressBarModal(text,id="remoteMeLoadingModal") {
	let remoteMeLoadingModal= document.querySelector('#'+id);

	if (remoteMeLoadingModal==undefined){
		remoteMeLoadingModal = $(` <dialog class="mdl-dialog" id="${id}">
				<div class="mdl-dialog__content" style="padding:0px;margin:0px">
				<h6 style="margin-top: 5px;">...</h6>
				<div class="mdl-progress mdl-js-progress mdl-progress__indeterminate"></div>
				</div>
			</dialog>`);

		$("body").append(remoteMeLoadingModal);
		componentHandler.upgradeDom();
		remoteMeLoadingModal= document.querySelector('#'+id);
	}


	if (! remoteMeLoadingModal.showModal) {
		dialogPolyfill.registerDialog(remoteMeLoadingModal);
	}
	$(remoteMeLoadingModal.querySelector("h6")).html(text);
	if (!remoteMeLoadingModal.hasAttribute("open")){
		remoteMeLoadingModal.showModal();
	}


}
function closeProgressBarModal(id="remoteMeLoadingModal") {
	remoteMeLoadingModal= document.querySelector('#'+id);
	if (remoteMeLoadingModal!=undefined){
		remoteMeLoadingModal.close();
	}
}
