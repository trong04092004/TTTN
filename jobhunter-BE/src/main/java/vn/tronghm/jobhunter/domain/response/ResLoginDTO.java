package vn.tronghm.jobhunter.domain.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import vn.tronghm.jobhunter.domain.Role;

@Getter
@Setter
public class ResLoginDTO {
  @JsonProperty("access_token")
  private String accessToken;

  private UserLogin user;

  @Getter
  @Setter
  @AllArgsConstructor
  @NoArgsConstructor
  public static class UserLogin {
    private long id;
    private String email;
    private String name;
    private Role role;
  }

  @Getter
  @Setter
  @AllArgsConstructor
  @NoArgsConstructor
  public static class UserGetAccount {
    private UserLogin user;
  }

  @Getter
  @Setter
  @AllArgsConstructor
  @NoArgsConstructor
  public static class UserInsideToken {
    private long id;
    private String email;
    private String name;
  }

}
