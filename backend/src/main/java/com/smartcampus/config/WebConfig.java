package com.smartcampus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /uploads/** to the physical 'uploads' folder in the project root
        String uploadDir = "uploads";
        Path uploadPath = Paths.get(uploadDir);
        String uploadAbsolutePath = uploadPath.toFile().getAbsolutePath();
        
        // This resolves the URL path http://localhost:8080/api/uploads/filename.jpg
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:/" + uploadAbsolutePath + "/");
    }
}
