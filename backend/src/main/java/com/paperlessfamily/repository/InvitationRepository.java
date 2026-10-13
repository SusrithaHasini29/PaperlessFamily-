package com.paperlessfamily.repository;

import com.paperlessfamily.entity.Invitation;
import com.paperlessfamily.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    List<Invitation> findByFamilyId(Long familyId);

    List<Invitation> findByEmailAndStatus(String email, InvitationStatus status);
}
