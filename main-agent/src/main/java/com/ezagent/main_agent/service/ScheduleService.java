package com.ezagent.main_agent.service;

import com.ezagent.main_agent.algorithm.BackwardScheduler;
import com.ezagent.main_agent.algorithm.ForwardScheduler;
import com.ezagent.main_agent.domain.SubTaskEntity;
import com.ezagent.main_agent.domain.TaskRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    // 우리가 만든 두 알고리즘 부품을 가져옵니다.
    private final BackwardScheduler backwardScheduler;
    private final ForwardScheduler forwardScheduler;

    /**
     * AI가 쪼개준 서브태스크들의 일정을 잡아줍니다.
     */
    public void assignTimeSlots(TaskRecord task, List<SubTaskEntity> subTasks) {

        if (task.getDeadline() != null) {
            // 1. 마감일이 명확한 경우 -> 마감일 맞춤형(Backward) 테트리스!
            backwardScheduler.schedule(task, subTasks);
            System.out.println("⏰ [ScheduleService] 마감일이 있어 Backward 스케줄링을 실행했습니다.");
        } else {
            // 2. 마감일이 없는 경우 -> 지금부터(Forward) 차곡차곡 테트리스!
            forwardScheduler.schedule(task, subTasks);
            System.out.println("🚀 [ScheduleService] 마감일이 없어 Forward 스케줄링을 실행했습니다.");
        }
    }
}