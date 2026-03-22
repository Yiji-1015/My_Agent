package com.ezagent.main_agent.algorithm;

import com.ezagent.main_agent.domain.SubTaskEntity;
import com.ezagent.main_agent.domain.TaskRecord;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component // 스프링이 관리하는 알고리즘 부품으로 등록!
public class BackwardScheduler {

    /**
     * 마감일(Deadline) 자정부터 역순으로 시간을 할당하는 알고리즘 뼈대입니다.
     */
    public void schedule(TaskRecord task, List<SubTaskEntity> subTasks) {
        if (task.getDeadline() == null)
            return;

        // 시작 기준점: 마감일 밤 11시 59분
        LocalDateTime currentEndTime = task.getDeadline().atTime(23, 59);

        // 태스크를 맨 마지막 것부터 역순으로 순회하며 달력 빈칸에 테트리스를 합니다.
        for (int i = subTasks.size() - 1; i >= 0; i--) {
            SubTaskEntity subTask = subTasks.get(i);
            // AI가 예상 시간을 안 줬다면 기본 60분으로 설정
            int estMin = subTask.getEstimatedMin() != null ? subTask.getEstimatedMin() : 60;

            subTask.setScheduledEnd(currentEndTime);
            subTask.setScheduledStart(currentEndTime.minusMinutes(estMin));

            // 바로 앞의 태스크는 현재 태스크의 '시작 시간'을 자신의 '종료 시간'으로 삼음 (거꾸로 이동)
            currentEndTime = subTask.getScheduledStart();
        }
    }
}