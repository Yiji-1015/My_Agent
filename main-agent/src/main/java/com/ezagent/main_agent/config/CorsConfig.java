package com.ezagent.main_agent.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // "우리 자바 건물(8080)의 모든 창구(/**)에 대해서..."
        registry.addMapping("/**")
                // "...리액트 주소(5173)에서 오는 손님은 무조건 프리패스 시켜줘라!"
                .allowedOrigins("http://localhost:5173", "http://localhost:8081") // ⚠️ 만약 리액트 주소가 다르면 이걸로 맞춰주세요!
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}