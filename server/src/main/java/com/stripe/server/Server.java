package com.stripe.server;

import com.google.gson.Gson;

import com.google.gson.GsonBuilder;
import com.stripe.Stripe;

import com.stripe.capture.later.CaptureLaterController;
import com.stripe.models.PublicKeyResponse;
import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import spark.Spark;

import static spark.Spark.get;
import static spark.Spark.staticFiles;

public class Server {

    private static Dotenv dotenv;

    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();


    public static void main(String[] args) {
        Spark.port(4242);

        dotenv = Dotenv.load();

        Stripe.apiKey = dotenv.get("STRIPE_SECRET_KEY");

        staticFiles.location("/static");

        get("/stripe-key", (req, resp) -> {
            resp.type("application/json");
            // Send publishable key to client
            return gson.toJson(new PublicKeyResponse(dotenv.get("STRIPE_PUBLISHABLE_KEY")));
        });

        var captureLaterController = new CaptureLaterController();
        captureLaterController.init();
    }
}