package com.ezagent.main_agent.repository;

import com.ezagent.main_agent.domain.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
}