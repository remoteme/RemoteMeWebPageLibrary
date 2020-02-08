function processAgreeds() {
	if ($("#agree")[0].checked && $("#agreeUser")[0].checked ) {


		$("#payment-request-button").css("display", "block");
		$("#agreeds").css("display", "none");
	} else {
		$("#payment-request-button").css("display", "none");
		$("#agreeds").css("display", "block");
	}
}

function showTermAndConditionsUser() {
	let text=`<iframe src="/g/_terms.html" style="border:none;width:100%;height:400px"></iframe> `;
	showCustomDialog("termsDialog","User Terms &  Conditions",text,"close");
}
function showTermAndConditionsRemoteMe() {
	let text=`<iframe src="https://remoteme.org/RemoteMeStripeTermsAndConditions.html" style="border:none;width:100%;height:400px"></iframe> `;
	showCustomDialog("termsDialog","RemoteMe Terms &  Conditions",text,"close");
	$("#agree")[0].checked=false;
}


function closePaymentDialog(){
	closeCustomDialog("paymentInfo");
}
function showPaymentDialog(singleStripePayment) {

	singleStripePayment = JSON.parse(singleStripePayment);


	var elementById = document.getElementById('paymentInfo');
	let htmlToInsert = '';
	if (elementById != undefined) {
		let template = Handlebars.compile(elementById.innerHTML);
		htmlToInsert = template({singleStripePayment: singleStripePayment});
	}


	let text=`${htmlToInsert}
				<div id="agreeds">
			
					<div style="margin-bottom:5px">
						<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="agree" style="width:48px;padding-left:0px;">
						  <input type="checkbox" id="agree" class="mdl-switch__input" onchange="processAgreeds()">
						</label>
						<div style="display:inline;cursor: pointer;left:0px" onclick="showTermAndConditionsRemoteMe()" target="_blank" class="mdl-switch__label">Accept RemoteMe Terms & conditions</div>
					</div>
					<div>
						<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="agreeUser"  style="width:48px;padding-left:0px;">
						  <input type="checkbox" id="agreeUser" class="mdl-switch__input" onchange="processAgreeds()">
						</label>
						<div  style="display:inline;cursor: pointer;left:0px"  onclick="showTermAndConditionsUser()" target="_blank" class="mdl-switch__label">Accept User Terms & conditions</div>
					</div>	 
				</div>
			
				<div id="payment-request-button"style="display: none" >
					<!-- A Stripe Element will be inserted here. -->
				</div>`;



	showCustomDialog("paymentDialog","Payment",text,"cancel Payment",()=>{
		insertPaymentButton(singleStripePayment);
	})	;



}

function processPayment() {
	$.ajax({
		type: "POST",
		dataType: "json",
		url: `/api/rest/v1/guest/processPayment/`,
		success: function (data) {
			//will be changed by guest state change
			closePaymentDialog();
		},
		error: function (error) {
			alert("error while processing payment")
		}
	});
}



function insertPaymentButton(singlePayment) {
	var stripe = Stripe(stripePublicKey, {
		stripeAccount: stripeUserAccount
	});
	var paymentRequest = stripe.paymentRequest({
		country: stripeUserCountry ,
		currency: singlePayment.currency.toLowerCase(),
		total: {
			label: singlePayment.label,
			amount: singlePayment.payment * 100,
		},
		requestPayerName: true,
		requestPayerEmail: true,
	});
	var elements = stripe.elements();
	var prButton = elements.create('paymentRequestButton', {
		paymentRequest: paymentRequest,
	});


	paymentRequest.canMakePayment().then(function (result) {
		if (result) {
			prButton.mount('#payment-request-button');
		} else {

		//	showInfoModal("You cannot make payments. Configure googlePay or Apple pay or add card info to the browser", "fas fa-exclamation-triangle", "#af0600");
		//	closePaymentDialog();
		}
	});

	paymentRequest.on('paymentmethod', function (ev) {

		$.ajax({
			type: "POST",
			dataType: "json",
			contentType: "application/json",
			data: JSON.stringify({
				payerEmail: ev.payerEmail,
				payerName: ev.payerName,
				singlePaymentId: singlePayment.id
			}),
			url: `/api/rest/v1/guest/payment/`,

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


