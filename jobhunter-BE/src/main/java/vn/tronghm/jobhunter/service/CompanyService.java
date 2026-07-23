package vn.tronghm.jobhunter.service;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import vn.tronghm.jobhunter.domain.Company;
import vn.tronghm.jobhunter.domain.User;
import vn.tronghm.jobhunter.domain.response.ResultPaginationDTO;
import vn.tronghm.jobhunter.repository.CompanyRepository;
import vn.tronghm.jobhunter.repository.UserRepository;

@Service
public class CompanyService {

  private final CompanyRepository companyRepository;
  private final UserRepository userRepository;
  private final KnowledgeIndexingService knowledgeIndexingService;

  public CompanyService(
      CompanyRepository companyRepository,
      UserRepository userRepository,
      KnowledgeIndexingService knowledgeIndexingService) {
    this.companyRepository = companyRepository;
    this.userRepository = userRepository;
    this.knowledgeIndexingService = knowledgeIndexingService;
  }

  public Company handleCreateCompany(Company c) {
    Company saved = this.companyRepository.save(c);
    this.knowledgeIndexingService.indexCompany(saved);
    return saved;
  }

  public ResultPaginationDTO handleGetCompany(Specification<Company> spec, Pageable pageable) {
    Page<Company> pCompany = this.companyRepository.findAll(spec, pageable);
    ResultPaginationDTO rs = new ResultPaginationDTO();
    ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

    mt.setPage(pageable.getPageNumber() + 1);
    mt.setPageSize(pageable.getPageSize());

    mt.setPages(pCompany.getTotalPages());
    mt.setTotal(pCompany.getTotalElements());

    rs.setMeta(mt);
    rs.setResult(pCompany.getContent());
    return rs;
  }

  public Company handleUpdateCompany(Company c) {
    Optional<Company> companyOptional = this.companyRepository.findById(c.getId());
    if (companyOptional.isPresent()) {
      Company currentCompany = companyOptional.get();
      currentCompany.setLogo(c.getLogo());
      currentCompany.setName(c.getName());
      currentCompany.setDescription(c.getDescription());
      currentCompany.setAddress(c.getAddress());
      Company saved = this.companyRepository.save(currentCompany);
      this.knowledgeIndexingService.indexCompany(saved);
      return saved;
    }
    return null;
  }

  public void handleDeleteCompany(long id) {
    Optional<Company> comOptional = this.companyRepository.findById(id);
    if (comOptional.isPresent()) {
      Company com = comOptional.get();
      // fetch all user belong to this company
      List<User> users = this.userRepository.findByCompany(com);
      this.userRepository.deleteAll(users);
    }

    this.knowledgeIndexingService.removeChunk(
        vn.tronghm.jobhunter.util.constant.KnowledgeSourceType.COMPANY, id);
    this.companyRepository.deleteById(id);
  }

  public Optional<Company> findById(long id) {
    return this.companyRepository.findById(id);
  }
}



