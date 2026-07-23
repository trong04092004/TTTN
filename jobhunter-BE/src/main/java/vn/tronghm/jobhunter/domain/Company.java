package vn.tronghm.jobhunter.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import vn.tronghm.jobhunter.util.SecurityUtil;

import java.time.Instant;
import java.util.List;

@Table(name = "companies")
@Entity
@Getter
@Setter
public class Company {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long id;

  @NotBlank(message = "name không được để trống")
  private String name;

  @Column(columnDefinition = "MEDIUMTEXT")
  private String description;

  private String address;

  private String logo;

  private Instant createdAt;

  private Instant updatedAt;

  private String createdBy;

  private String updatedBy;

  @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
  @JsonIgnore
  List<User> users;

  @OneToMany(mappedBy = "company", fetch = FetchType.LAZY)
  @JsonIgnore
  List<Job> jobs;

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

