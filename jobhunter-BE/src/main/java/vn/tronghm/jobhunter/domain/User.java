package vn.tronghm.jobhunter.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.tronghm.jobhunter.util.SecurityUtil;
import vn.tronghm.jobhunter.util.constant.GenderEnum;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long id;

  private String name;

  @NotBlank(message = "email không được để trống")
  private String email;

  @NotBlank(message = "password không được để trống")
  private String password;

  private int age;

  @Enumerated(EnumType.STRING)
  private GenderEnum gender;

  private String address;

  @Column(columnDefinition = "MEDIUMTEXT")
  private String refreshToken;

  private Instant createdAt;
  private Instant updatedAt;
  private String createdBy;
  private String updatedBy;

  @ManyToOne
  @JoinColumn(name = "company_id")
  private Company company;

  @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
  @JsonIgnore
  List<Resume> resumes;

  @ManyToOne
  @JoinColumn(name = "role_id")
  private Role role;

  @PrePersist
  public void handleBeforeCreate() {
    this.createdBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
        ? SecurityUtil.getCurrentUserLogin().get()
        : "";

    this.createdAt = Instant.now();
  }

  @PreUpdate
  public void handleBeforeUpdate() {
    this.updatedBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
        ? SecurityUtil.getCurrentUserLogin().get()
        : "";

    this.updatedAt = Instant.now();
  }
}

