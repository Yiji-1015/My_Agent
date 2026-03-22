package com.ezagent.main_agent.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 프론트엔드 React에서 오는 요청을 허용합니다!
        registry.addMapping("/**")
                .allowedOriginPatterns("http://localhost:*") // 5173이든 8081이든 로컬호스트면 전부 허용!
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
