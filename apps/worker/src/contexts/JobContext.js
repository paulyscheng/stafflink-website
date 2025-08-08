import React, { createContext, useContext, useState } from 'react';

const JobContext = createContext();

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};

export const JobProvider = ({ children }) => {
  // 初始为空数组，真实数据从API获取
  const [jobs, setJobs] = useState([]);

  // 注释掉的模拟数据
  /*
    {
      id: 'job_002', 
      companyName: '鸿运清洁服务',
      projectName: '办公楼清洁',
      projectAddress: '海淀区中关村大街1号',
      requiredSkills: ['清洁工'],
      startDate: '2024-01-12',
      endDate: '2024-01-12',
      startTime: '18:00',
      endTime: '22:00',
      paymentType: 'fixed',
      budgetRange: '300',
      workDescription: '办公楼日常清洁，包括地面清洁、垃圾清理、卫生间清洁。',
      timeNotes: '下班时间进行，避免影响办公。',
      status: 'pending',
      sentTime: '2024-01-09T15:30:00Z',
      distance: 5.2,
      urgency: 'urgent',
      companyRating: 4.3,
      estimatedDuration: '4小时',
      requiredWorkers: 3,
      companyContact: {
        name: '王主管',
        phone: '139****5678'
      }
    },
    {
      id: 'job_003',
      companyName: '金牌家政服务',
      projectName: '家庭深度清洁',
      projectAddress: '西城区复兴门内大街',
      requiredSkills: ['清洁工'],
      startDate: '2024-01-20',
      endDate: '2024-01-20',
      startTime: '10:00',
      endTime: '16:00',
      paymentType: 'daily',
      budgetRange: '400',
      workDescription: '三居室家庭深度清洁，包括厨房、卫生间、客厅卧室全面清理。',
      status: 'accepted',
      sentTime: '2024-01-08T14:20:00Z',
      distance: 3.8,
      urgency: 'normal',
      companyRating: 4.9,
      estimatedDuration: '6小时',
      requiredWorkers: 1,
      companyContact: {
        name: '刘阿姨',
        phone: '136****9012'
      },
      acceptedTime: '2024-01-08T16:00:00Z',
      workerMessage: '我可以准时到达，有5年清洁经验。'
    }
  */
  // ]);

  const respondToJob = (jobId, response, message = '') => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: response, // 'accepted' or 'rejected'
          responseTime: new Date().toISOString(),
          workerMessage: message
        };
      }
      return job;
    }));
  };

  const getJobsByStatus = (status) => {
    return jobs.filter(job => job.status === status);
  };

  const getPendingJobs = () => {
    return jobs.filter(job => job.status === 'pending');
  };

  const getAcceptedJobs = () => {
    return jobs.filter(job => job.status === 'accepted');
  };

  const getJobStats = () => {
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      accepted: jobs.filter(j => j.status === 'accepted').length,
      rejected: jobs.filter(j => j.status === 'rejected').length,
    };
  };

  const getJob = (jobId) => {
    return jobs.find(job => job.id === jobId);
  };

  const value = {
    jobs,
    respondToJob,
    getJobsByStatus,
    getPendingJobs,
    getAcceptedJobs,
    getJobStats,
    getJob,
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};