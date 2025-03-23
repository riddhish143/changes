import React from 'react';
import { Card, CardBody } from '@chakra-ui/react';
import { Steps } from 'antd';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import '../styles/Steps.css';

const StepsDisplay = () => {
  const { 
    repoOwner, 
    repoName, 
    selectedBranch, 
    selectedMilestone,
    milestones,
    issues,
    issuesFetched,
    changelogGenerated,
    getCurrentStep
  } = useAppContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card mb={2} className="steps-card">
        <CardBody>
          <Steps
            size="small"
            current={getCurrentStep()}
            items={[
              {
                title: 'Repository',
                description: repoOwner && repoName ? `✓ ${repoOwner}/${repoName}` : 'Select Repository',
              },
              {
                title: 'Branch',
                description: selectedBranch ? `✓ ${selectedBranch}` : 'Select Branch',
              },
              {
                title: 'Milestone',
                description: selectedMilestone ? `✓ ${milestones.find(m => m.id.toString() === selectedMilestone)?.title}` || 'Selected' : 'Select Milestone',
              },
              {
                title: 'Issues',
                description: issuesFetched ? `✓ ${issues.length} issues fetched` : (issues.length > 0 ? `${issues.length} issues` : 'Fetch Issues'),
                status: issuesFetched ? 'finish' : undefined
              },
              {
                title: 'Generate',
                description: changelogGenerated ? '✓ CHANGES.md generated' : 'Generate CHANGES.md',
                status: changelogGenerated ? 'finish' : undefined
              }
            ]}
          />
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default StepsDisplay; 