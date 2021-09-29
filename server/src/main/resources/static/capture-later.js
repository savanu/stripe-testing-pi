// A reference to Stripe.js
var stripe;

fetch("/stripe-key")
    .then(function (result) {
        return result.json();
    })
    .then(function (data) {
        return setupElements(data);
    })
    .then(function ({stripe, card, clientSecret}) {
        document.querySelector("#submit").addEventListener("click", function (evt) {
            evt.preventDefault();
            pay(stripe, card, clientSecret);
        });
    });

var setupElements = function (data) {
    stripe = Stripe(data.publicKey);
    /* ------- Set up Stripe Elements to use in checkout form ------- */
    var elements = stripe.elements();
    var style = {
        base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#aab7c4"
            }
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a"
        }
    };

    var card = elements.create("card", {style: style});
    card.mount("#card-element");

    return {
        stripe: stripe,
        card: card,
        clientSecret: data.clientSecret
    };
};

var handleAction = function (clientSecret) {
    stripe.handleCardAction(clientSecret).then(function (data) {
        if (data.error) {
            showError("Your card was not authenticated, please try again");
        } else if (data.paymentIntent.status === "requires_confirmation") {
            fetch("/pay", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    paymentIntentId: data.paymentIntent.id
                })
            })
                .then(function (result) {
                    return result.json();
                })
                .then(function (json) {
                    if (json.error) {
                        showError(json.error);
                    } else {
                        orderComplete(clientSecret);
                    }
                });
        }
    });
};

/*
 * Collect card details and pay for the order
 */
var pay = function (stripe, card) {
    var cardholderName = document.querySelector("#name").value;
    var data = {
        billing_details: {}
    };

    if (cardholderName) {
        data["billing_details"]["name"] = cardholderName;
    }

    changeLoadingState(true);

    fetch("/capture-later/create-pi", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: "temp"
    }).then(result => {
        return result.json();
    }).then(resp => {
        let piClientKey = resp.clientKey;

        return stripe.confirmCardPayment(piClientKey, {
            payment_method: {
                card: card,
                billing_details: {
                    name: cardholderName,
                }
            }
        })
    }).then(result => {
        return fetch("/capture-later/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                paymentIntentId: result.paymentIntent.id
            })
        })
    }).then(result => {
        return result.json()
    }).then(result => {
        orderComplete(result.clientKey);
    })
};

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function (clientSecret) {
    stripe.retrievePaymentIntent(clientSecret).then(function (result) {
        var paymentIntent = result.paymentIntent;
        var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);
        document.querySelectorAll(".payment-view").forEach(function (view) {
            view.classList.add("hidden");
        });
        document.querySelectorAll(".completed-view").forEach(function (view) {
            view.classList.remove("hidden");
        });
        document.querySelector(".order-status").textContent =
            paymentIntent.status === "succeeded" ? "succeeded" : "failed";
        document.querySelector("pre").textContent = paymentIntentJson;
    });
};

var showError = function (errorMsgText) {
    changeLoadingState(false);
    var errorMsg = document.querySelector(".sr-field-error");
    errorMsg.textContent = errorMsgText;
    setTimeout(function () {
        errorMsg.textContent = "";
    }, 4000);
};

// Show a spinner on payment submission
var changeLoadingState = function (isLoading) {
    if (isLoading) {
        document.querySelector("button").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("button").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
};
