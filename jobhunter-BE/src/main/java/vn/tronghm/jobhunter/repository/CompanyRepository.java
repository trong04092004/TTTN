package vn.tronghm.jobhunter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import vn.tronghm.jobhunter.domain.Company;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long>,
    JpaSpecificationExecutor<Company> {

}

