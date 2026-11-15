package com.saasturnos.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SaasTurnosApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaasTurnosApplication.class, args);
    }
}

