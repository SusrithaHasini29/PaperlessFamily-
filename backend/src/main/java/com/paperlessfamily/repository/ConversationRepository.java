package com.paperlessfamily.repository;

import com.paperlessfamily.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserIdAndFamilyIdOrderByUpdatedAtDesc(Long userId, Long familyId);
}
