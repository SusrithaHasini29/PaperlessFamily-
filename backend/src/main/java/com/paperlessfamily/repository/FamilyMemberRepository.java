package com.paperlessfamily.repository;

import com.paperlessfamily.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    List<FamilyMember> findByFamilyId(Long familyId);

    Optional<FamilyMember> findByUserIdAndFamilyId(Long userId, Long familyId);

    Optional<FamilyMember> findByUserId(Long userId);

    List<FamilyMember> findByUserEmail(String email);

    boolean existsByUserIdAndFamilyId(Long userId, Long familyId);

    long countByFamilyId(Long familyId);
}
