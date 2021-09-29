package com.stripe.models;

public class PaymentIntentClientKeyResponse {
    /**
     * Used by client as the pi secret
     */
    private final String clientKey;

    /**
     * Should be ideally tracked on some user cart,session, etc.
     */
    private final String paymentIntentId;

    public PaymentIntentClientKeyResponse(String clientKey, String paymentIntentId) {
        this.clientKey = clientKey;
        this.paymentIntentId = paymentIntentId;
    }
}
