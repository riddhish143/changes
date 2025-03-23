import React from 'react';
import { Card, CardBody } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import RepositoryForm from '../components/RepositoryForm';
import BranchSelector from '../components/BranchSelector';
import MilestoneSelector from '../components/MilestoneSelector';
import IssueList from '../components/IssueList';
import { GITHUB_ENTERPRISE_URL } from '../context/AppContext';

const MainContent = () => {
  const {
    // Repository state
    repoOwner,
    repoName,
    setRepoOwner,
    setRepoName,
    
    // Branch state
    branches,
    selectedBranch,
    branchFilter,
    branchesFetched,
    branchesError,
    loadingBranches,
    setBranchFilter,
    
    // Milestone state
    milestones,
    selectedMilestone,
    milestonesFetched,
    milestonesError,
    loadingMilestones,
    
    // Issues state
    issues,
    issuesFetched,
    issuesError,
    loadingIssues,
    
    // App state
    currentStep,
    changelogError,
    setChangelogError,
    
    // Handlers
    handleFetchBranches,
    handleFetchMilestones,
    handleFetchIssues,
    handleBranchChange,
    handleMilestoneChange,
    handleChangelogGeneration,
  } = useAppContext();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardBody>
            <RepositoryForm
              repoOwner={repoOwner}
              repoName={repoName}
              loading={loadingBranches}
              currentStep={currentStep}
              onOwnerChange={setRepoOwner}
              onNameChange={setRepoName}
              onFetch={handleFetchBranches}
              fetchSuccess={branchesFetched}
              fetchError={branchesError}
            />
          </CardBody>
        </Card>
      </motion.div>

      {branches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardBody>
              <BranchSelector
                branches={branches}
                branchFilter={branchFilter}
                selectedBranch={selectedBranch}
                onFilterChange={setBranchFilter}
                onBranchChange={handleBranchChange}
                onFetchMilestones={handleFetchMilestones}
                loading={loadingMilestones}
                fetchSuccess={milestonesFetched}
                fetchError={milestonesError}
              />
            </CardBody>
          </Card>
        </motion.div>
      )}

      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardBody>
              <MilestoneSelector
                milestones={milestones}
                selectedMilestone={selectedMilestone}
                onMilestoneChange={handleMilestoneChange}
                onFetchIssues={handleFetchIssues}
                loading={loadingIssues}
                issuesFetched={issuesFetched}
                fetchError={issuesError}
              />
            </CardBody>
          </Card>
        </motion.div>
      )}

      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardBody>
              <IssueList
                issues={issues}
                repoOwner={repoOwner}
                repoName={repoName}
                githubEnterpriseUrl={GITHUB_ENTERPRISE_URL}
                selectedMilestone={selectedMilestone}
                selectedBranch={selectedBranch}
                milestones={milestones}
                onChangelogGenerated={handleChangelogGeneration}
                changelogError={changelogError}
                setChangelogError={setChangelogError}
              />
            </CardBody>
          </Card>
        </motion.div>
      )}
    </>
  );
};

export default MainContent; 