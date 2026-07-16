package vn.tronghm.jobhunter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PermissionInterceptorConfiguration implements WebMvcConfigurer {
  @Bean
  PermissionInterceptor getPermissionInterceptor() {
    return new PermissionInterceptor();
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    String[] whiteList = {
        "/", "/api/v1/auth/**", "/storage/**", "/api/v1/email/**", "/ws/**"
    };
    registry.addInterceptor(getPermissionInterceptor())
        .excludePathPatterns(whiteList);
  }
}

