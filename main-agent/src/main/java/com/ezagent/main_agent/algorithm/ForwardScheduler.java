package com.ezagent.main_agent.algorithm;

import com.ezagent.main_agent.domain.SubTaskEntity;
import com.ezagent.main_agent.domain.TaskRecord;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ForwardScheduler {

    /**
     * 지금 당장(또는 내일)부터 순방향으로 빈 시간을 찾는 알고리즘 뼈대입니다.
     */
    public void schedule(TaskRecord task, List<SubTaskEntity> subTasks) {

        // 시작 기준점: 지금으로부터 1시간 뒤 (여유 시간)
        LocalDateTime currentStartTime = LocalDateTime.now().plusHours(1);

        // 태스크를 처음부터 순차적으로 순회하며 테트리스를 합니다.
        for (SubTaskEntity subTask : subTasks) {
            int estMin = subTask.getEstimatedMin() != null ? subTask.getEstimatedMin() : 60;

            subTask.setScheduledStart(currentStartTime);
            subTask.setScheduledEnd(currentStartTime.plusMinutes(estMin));

            // 다음 태스크는 현재 태스크가 '끝난 직후'에 시작 (앞으로 이동)
            currentStartTime = subTask.getScheduledEnd();
        }
    }
}