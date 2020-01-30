function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}



function processAgreeds(){

	if ( validateEmail($("#email").val()) && $("#agree")[0].checked){
		$("#confirmButton").attr("disabled", false);
	}else{
		$("#confirmButton").attr("disabled", true);
	}

}

function processEmailAndAgreeds(){
	$("#agreeds").css("display","none");
	$("#payment-request-button").css("display","block");
}

function showPaymentButton(singleStripePayment) {

	singleStripePayment = JSON.parse(singleStripePayment);


	var elementById = document.getElementById('paymentInfo');
	let htmlToInsert = '';
	if (elementById != undefined) {
		let template = Handlebars.compile(elementById.innerHTML);
		htmlToInsert = template({singleStripePayment: singleStripePayment});
	}

	let paymentContainerButton = document.querySelector('#paymentContainer');

	if (paymentContainerButton != undefined) {
		paymentContainerButton.remove();
	}
	paymentContainerButton = $(` <dialog class="mdl-dialog" id="paymentContainer">
				<div class="mdl-dialog__content" style="padding:0px;margin:0px">
				${htmlToInsert}
				
				<div id="agreeds">
				 <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
					<input class="mdl-textfield__input" type="email" id="email" onkeyup="processAgreeds()">
					<label class="mdl-textfield__label" for="sample3">Add Your Email (for payment process)</label>
				  </div>
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="agree">
				  <input type="checkbox" id="agree" class="mdl-switch__input" onchange="processAgreeds()">
				  <a href="http:\\google.pl" target="_blank" class="mdl-switch__label">Accept Terms & conditions</a>
				</label>
					<button onclick="processEmailAndAgreeds()"  id="confirmButton"
					 class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" style="margin-top:10px" disabled >Process </button>
			   
				</div>
			
				<div id="payment-request-button"style="display: none" >
					<!-- A Stripe Element will be inserted here. -->
				</div>
				 <button onclick="closePaymentButton()" 
				 class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" style="margin-top:10px;width:100%" >Cancel Payment </button>
           
				</div>
			</dialog>`);

	$("body").append(paymentContainerButton);
	componentHandler.upgradeDom();
	paymentContainerButton = document.querySelector('#paymentContainer');


	if (!paymentContainerButton.showModal) {
		dialogPolyfill.registerDialog(paymentContainerButton);
	}

	if (!paymentContainerButton.hasAttribute("open")) {
		paymentContainerButton.showModal();
		insertPaymentButton(singleStripePayment);
	}


}

function processPayment() {
	$.ajax({
		type: "POST",
		dataType: "json",
		url: `/api/rest/v1/guest/processPayment/`,
		success: function (data) {
			//will be changed by guest state change
			closePaymentButton();
		},
		error: function (error) {
			alert("error while processing payment")
		}
	});
}

function closePaymentButton() {
	let paymentContainerButton = document.querySelector('#paymentContainer');
	if (paymentContainerButton != undefined) {
		paymentContainerButton.close();
	}
}

function insertPaymentButton(singlePayment) {
	var stripe = Stripe(stripePublicKey, {
		stripeAccount: userStripeAccount
	});
	var paymentRequest = stripe.paymentRequest({
		country: 'US',
		currency: singlePayment.currency.toLowerCase(),
		total: {
			label: singlePayment.label,
			amount: singlePayment.payment * 100,
		},
		requestPayerName: false,
		requestPayerEmail: true,
	});
	var elements = stripe.elements();
	var prButton = elements.create('paymentRequestButton', {
		paymentRequest: paymentRequest,
	});

// Check the availability of the Payment Request API first.
	paymentRequest.canMakePayment().then(function (result) {
		if (result) {
			prButton.mount('#payment-request-button');
		} else {

			showInfoModal("You cannot make payments. Configure googlePay or Apple pay or add card info to the browser", "fas fa-exclamation-triangle", "#af0600");
			closePaymentButton();
		}
	});

	paymentRequest.on('paymentmethod', function (ev) {

		$.ajax({
			type: "POST",
			dataType: "json",
			data:{email:$("#email").val()},
			url: `/api/rest/v1/guest/payment/${singlePayment.id}/`,

			success: function (data) {

				stripe.confirmCardPayment(
					data.clientSecret,
					{payment_method: ev.paymentMethod.id},
					{handleActions: false}
				).then(function (confirmResult) {
					if (confirmResult.error) {
						console.info(confirmResult);
						// Report to the browser that the payment failed, prompting it to
						// re-show the payment interface, or show an error message and close
						// the payment interface.
						ev.complete('fail');
						console.info("FAIL")

					} else {
						// Report to the browser that the confirmation was successful, prompting
						// it to close the browser payment method collection interface.
						ev.complete('success');
						// Let Stripe.js handle the rest of the payment flow.
						stripe.confirmCardPayment(data.clientSecret,).then(function (result) {


							if (result.error) {
								// The payment failed -- ask your customer for a new payment method.
							} else {
								processPayment();
							}
						});
					}
				});
			},
			error: function (error) {
				alert("erorr while charging in debug mode. Did You active stripe debug at webpage ?. Then reload session")
			}
		});

		// Confirm the PaymentIntent without handling potential next actions (yet).

	});

}


