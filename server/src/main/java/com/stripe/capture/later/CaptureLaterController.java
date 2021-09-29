package com.stripe.capture.later;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.models.CheckoutRequest;
import com.stripe.models.PaymentIntentClientKeyResponse;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import spark.Request;
import spark.Response;

import static spark.Spark.post;
import static spark.Spark.get;
import static spark.Spark.path;

public class CaptureLaterController {

    private final static Logger LOGGER = LoggerFactory.getLogger(CaptureLaterController.class);

    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    private String checkout(Request req, Response resp) throws StripeException {
        var cReq = gson.fromJson(req.body(), CheckoutRequest.class);

        var pi = PaymentIntent.retrieve(cReq.getPaymentIntentId());

        LOGGER.info("Payment Intent:\n{}", gson.toJson(pi, PaymentIntent.class));

        pi = pi.capture();

        LOGGER.info("Payment Intent Post Capture\n{}", gson.toJson(pi, PaymentIntent.class));

        resp.type("application/json");
        return gson.toJson(new PaymentIntentClientKeyResponse(pi.getClientSecret(), pi.getId()));
    }

    private String createPaymentIntent(Request req, Response resp) throws StripeException {
        var params = PaymentIntentCreateParams.builder()
                .addPaymentMethodType("card")
                .setAmount(1000L)
                .setCurrency("usd")
                .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.MANUAL)
                .build();

        var pi = PaymentIntent.create(params);
        LOGGER.info("Created Payment Intent with manual capture method: {}", pi.getId());

        resp.type("application/json");
        return gson.toJson(new PaymentIntentClientKeyResponse(pi.getClientSecret(), pi.getId()));
    }

    public void init() {
        path("/capture-later", () -> {
            post("/create-pi", this::createPaymentIntent);
            post("/checkout", this::checkout);
        });
    }
}
