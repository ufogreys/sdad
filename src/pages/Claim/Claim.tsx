import React, { useState, useEffect } from 'react'
import { Claiming, Claimed } from 'src/pages/Claim'
import Box from '@material-ui/core/Box'
import { useThemeMode } from 'src/theme/ThemeProvider'
import { ChooseDelegate } from './ChooseDelegate'
import { ClaimReview } from './ClaimReview'
import { ClaimStart } from './ClaimStart'
import { useClaim } from './useClaim'
import { ClaimWrapper } from './ClaimWrapper'
import { useWeb3Context } from 'src/contexts/Web3Context'
import { correctClaimChain } from './claims'
import { formatError } from 'src/utils/format'
import { useQueryParams } from 'src/hooks'

export function Claim() {
  const { isDarkMode } = useThemeMode()
  const { connectedNetworkId } = useWeb3Context()
  const [step, setStep] = useState(0)
  const [showTryAgain, setShowTryAgain] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [showInfoModal, setShowInfoModal] = useState<any>(false)
  const nextStep = () => setStep(val => val + 1)
  const prevStep = () => setStep(val => val - 1)
  const { queryParams } = useQueryParams()
  const {
    claimableTokens,
    canClaim,
    loading,
    warning,
    sendClaimTokens,
    claiming,
    inputValue,
    setInputValue,
    claimTokensTx,
    delegate,
    setDelegate,
    error,
    setError,
    hasManyVotes,
    hasAlreadyClaimed,
    setClaiming,
    merkleRootSet,
    checkNetwork
  } = useClaim()

  useEffect(() => {
    if (hasAlreadyClaimed) {
      setStep(4)
    } else if (step === 4) {
      setStep(0)
    }
  }, [hasAlreadyClaimed])

  async function claimTokens() {
    try {
      if (queryParams.demo === 'true') {
        setClaiming(true)
        setError('')
        setShowTryAgain(false)
        setTimeout(() => {
          nextStep()
        }, 2 * 1000)
        return
      }

      setError('')
      setShowTryAgain(false)
      const res = await sendClaimTokens()
      if (res?.status === 1) {
        setShowTryAgain(false)
        nextStep()
      } else {
        setShowTryAgain(true)
      }
    } catch (err: any) {
      console.error(err)
      setError(formatError(err.message))
      setShowTryAgain(true)
    }
  }

  function handleDelegateConfirm(confirmed: boolean) {
    setShowConfirmModal(false)
    if (confirmed) {
      nextStep()
    }
  }

  async function handleStartClaim() {
    try {
      await checkNetwork()
    } catch (err) { }
    nextStep()
  }

  const steps = [
    <ClaimStart
      key="Claim HOP"
      claimableTokens={claimableTokens}
      nextStep={handleStartClaim}
      isDarkMode={isDarkMode}
    />,
    <ChooseDelegate
      key="Choose a Delegate"
      setInputValue={setInputValue}
      inputValue={inputValue}
      delegate={delegate}
      showConfirmModal={showConfirmModal}
      setShowConfirmModal={setShowConfirmModal}
      showInfoModal={showInfoModal}
      setShowInfoModal={setShowInfoModal}
      handleDelegateConfirm={handleDelegateConfirm}
      onContinue={async () => {
        const tooMany = await hasManyVotes(delegate)
        if (tooMany) {
          setShowConfirmModal(true)
        } else {
          nextStep()
        }
      }}
      selectDelegate={setDelegate}
    />,
    <ClaimReview
      key="Review your Claim"
      claimableTokens={claimableTokens}
      prevStep={prevStep}
      delegate={delegate}
      isDarkMode={isDarkMode}
      handleClaimTokens={() => {
        nextStep()
        claimTokens()
      }}
    />,
    <Claiming
      key="Confirm with Wallet"
      claiming={claiming}
      isDarkMode={isDarkMode}
      tx={claimTokensTx}
      delegate={delegate}
      claimableTokens={claimableTokens}
      showTryAgain={showTryAgain}
      handleClaimTokens={() => {
        claimTokens()
      }}
    />,
    <Claimed key="" />,
  ]

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center">
      <ClaimWrapper
        loading={loading}
        isDarkMode={isDarkMode}
        connectedNetworkId={connectedNetworkId}
        correctClaimChain={correctClaimChain}
        claimableTokens={claimableTokens}
        canClaim={canClaim}
        merkleRootSet={merkleRootSet}
        title={steps[step].key}
        warning={warning}
        step={step}
        prevStep={prevStep}
        nextStep={nextStep}
        handleClaimTokens={claimTokens}
        delegate={delegate}
        claiming={claiming}
        inputValue={inputValue}
        setInputValue={setInputValue}
        setStep={setStep}
        error={error}
        setError={setError}
      >
        {steps[step]}
      </ClaimWrapper>
    </Box>
  )
}
