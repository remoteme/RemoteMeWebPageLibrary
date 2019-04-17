

{
	'use strict';
	(function () {
		function whenLoaded() {
			getmdlExtend.init('.getmdl-extend');
		};

		window.addEventListener ?
			window.addEventListener("load", whenLoaded, false) :
			window.attachEvent && window.attachEvent("onload", whenLoaded);

	}());

	var getmdlExtend = {
		_addEventListeners: function (dropdown) {
			var input = dropdown.querySelector('.mdl-icon-toggle__label');

			var list = dropdown.querySelectorAll('li');
			var menu = dropdown.querySelector('.mdl-js-menu');
			var arrow = dropdown.querySelector('.mdl-icon-toggle__label');
			var label = '';
			var previousValue = '';
			var previousDataVal = '';
			var opened = false;



			var hideAllMenus = function () {
				opened = false;

				if (!dropdown.querySelector('.mdl-menu__container').classList.contains('is-visible')) {
					dropdown.classList.remove('is-focused');
				}

				var event = new Event('closeSelect');
				menu.dispatchEvent(event);
			};
			document.body.addEventListener('click', hideAllMenus, false);

			//hide previous select after press TAB
			dropdown.onkeydown = function (event) {
				if (event.keyCode == 9) {

					menu['MaterialMenu'].hide();
					dropdown.classList.remove('is-focused');
				}
			};





			menu.addEventListener('closeSelect', function (e) {

				dropdown.classList.remove('is-focused');
				if (label !== '') {
					dropdown.querySelector('.mdl-textfield__label').textContent = label;
					label = '';
				}
			});

			//set previous value and data-val if ESC was pressed
			menu.onkeydown = function (event) {
				if (event.keyCode == 27) {

					dropdown.classList.remove('is-focused');
					if (label !== '') {
						dropdown.querySelector('.mdl-textfield__label').textContent = label;
						label = '';
					}
				}
			};


			arrow.onclick = function (e) {
				e.stopPropagation();
				if (opened) {
					menu['MaterialMenu'].hide();
					opened = false;
					dropdown.classList.remove('is-focused');


				} else {
					hideAllMenus();
					dropdown.MaterialTextfield.onFocus_();

					menu['MaterialMenu'].show();
					opened = true;
				}
			};


			[].forEach.call(list, function (li) {
				li.onfocus = function () {
					dropdown.classList.add('is-focused');
					var value = li.textContent.trim();

					if (!dropdown.classList.contains('mdl-textfield--floating-label') && label == '') {
						label = dropdown.querySelector('.mdl-textfield__label').textContent.trim();
						dropdown.querySelector('.mdl-textfield__label').textContent = '';
					}
				};

				li.onclick = function (e) {
					hideAllMenus();
				};


			});
		},
		init: function (selector) {
			var dropdowns = document.querySelectorAll(selector);
			[].forEach.call(dropdowns, function (dropdown) {
				getmdlExtend._addEventListeners(dropdown);
				componentHandler.upgradeElement(dropdown);
				componentHandler.upgradeElement(dropdown.querySelector('ul'));
			});
		}
	};
}
