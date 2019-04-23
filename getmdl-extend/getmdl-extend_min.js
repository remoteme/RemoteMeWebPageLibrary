

{
	'use strict';
	(function () {

	//	window.addEventListener ?
			//window.addEventListener("load", whenLoaded, false) :
			//window.attachEvent && window.attachEvent("onload", whenLoaded);

	}());

	var getmdlExtend = {
		_addEventListeners: function (dropdown) {
			var input = dropdown.querySelector('.mdl-icon-toggle__label');
			var mainSwitch = dropdown.querySelectorAll('.main-switch');
			var list = dropdown.querySelectorAll('li');
			var menu = dropdown.querySelector('.mdl-js-menu');
			var arrow = dropdown.querySelector('.mdl-icon-toggle__label');
			var label = '';
			var opened = false;



			var hideAllMenus = function () {
				opened = false;

				if (!dropdown.querySelector('.mdl-menu__container').classList.contains('is-visible')) {
					dropdown.classList.remove('is-focused');
				}

				var event = new Event('closeSelect');
				menu.dispatchEvent(event);
			};


			arrow.onclick = function (e) {
				e.stopPropagation();
				if (opened) {
					menu['MaterialMenu'].hide();
					opened = false;
					dropdown.classList.remove('is-focused');
					hideAllMenus();

				} else {
					hideAllMenus();
					dropdown.MaterialTextfield.onFocus_();

					menu['MaterialMenu'].show();
					opened = true;
				}
			};

		}
	};
}
