import {
  ChakraProvider,
  Box,
  Text,
  Container,
  Grid,
  GridItem,
  Input,
  Button,
  VStack,
  HStack,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
  extendTheme,
} from '@chakra-ui/react'
import { useState } from 'react'
import { AddIcon, CloseIcon } from '@chakra-ui/icons'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerAutocomplete } from './components/PlayerAutocomplete'

// Custom theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#B3E0FF',
      200: '#80CBFF',
      300: '#4DB5FF',
      400: '#1A9FFF',
      500: '#0077CC',
      600: '#005C9E',
      700: '#004170',
      800: '#002542',
      900: '#001014',
    },
    tech: {
      100: '#1A1A1A',
      200: '#242424',
      300: '#2D2D2D',
      400: '#363636',
    }
  },
  styles: {
    global: {
      body: {
        bg: 'tech.100',
        color: 'whiteAlpha.900',
      }
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.400',
          color: 'white',
          _hover: {
            bg: 'brand.500',
          }
        }
      }
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'tech.200',
            _hover: {
              bg: 'tech.300',
            },
            _focus: {
              bg: 'tech.300',
              borderColor: 'brand.400',
            }
          }
        }
      },
      defaultProps: {
        variant: 'filled',
      }
    }
  }
})

const MotionBox = motion(Box)
const MotionAlert = motion(Alert)
const MotionVStack = motion(VStack)

// Add these color constants
const COLORS = {
  borderDefault: 'rgba(45, 45, 45, 1)',
  borderHover: 'rgba(26, 159, 255, 1)',
  boxShadowDefault: 'rgba(0, 0, 0, 0.4)',
  boxShadowHover: 'rgba(0, 0, 0, 0.5)',
}

const cardTransition = {
  initial: { duration: 0.5 },
  hover: { duration: 0.2 }
}

interface TradeAnalysis {
  score: number
  grade: string
  analysis: string
  trade_id: number
}

const GradeCircle = ({ grade, score }: { grade: string; score: number }) => (
  <Box
    position="relative"
    width="120px"
    height="120px"
    borderRadius="full"
    border="4px solid"
    borderColor={score >= 70 ? 'brand.400' : score >= 50 ? 'yellow.400' : 'red.400'}
    display="flex"
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
    bg="tech.200"
  >
    <Text
      fontSize="2xl"
      fontWeight="bold"
      color={score >= 70 ? 'brand.400' : score >= 50 ? 'yellow.400' : 'red.400'}
    >
      {grade}
    </Text>
    <Text fontSize="sm" color="whiteAlpha.700">
      {score}/100
    </Text>
  </Box>
)

const LoadingOverlay = () => (
  <MotionBox
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bg="blackAlpha.800"
    backdropFilter="blur(8px)"
    display="flex"
    alignItems="center"
    justifyContent="center"
    zIndex={1000}
  >
    <VStack spacing={4}>
      <Box
        width="120px"
        height="120px"
        borderRadius="full"
        border="4px solid"
        borderColor="brand.400"
        borderTopColor="transparent"
        animation="spin 1s linear infinite"
        sx={{
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}
      />
      <Text fontSize="xl" fontWeight="bold" color="whiteAlpha.900">
        Analyzing Trade...
      </Text>
      <Text color="whiteAlpha.700">
        Evaluating player values and matchups
      </Text>
    </VStack>
  </MotionBox>
)

const BackgroundPattern = () => (
  <Box
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    zIndex={0}
    bg="tech.100"
    _after={{
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgGradient: 'radial(circle at top, brand.400 0%, transparent 70%)',
      opacity: 0.1,
      zIndex: 1
    }}
  />
)

const FootballField = () => (
  <Box
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    zIndex={1}
    overflow="hidden"
    sx={{
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    }}
  >
    <Box
      position="absolute"
      left="50%"
      bottom="-10%"
      transform="translateX(-50%) rotateX(60deg)"
      width="200%"
      height="100%"
      opacity={0.05}
      sx={{
        backgroundImage: `
          linear-gradient(90deg, transparent 0%, transparent 49%, rgba(26, 159, 255, 0.3) 49%, rgba(26, 159, 255, 0.3) 51%, transparent 51%, transparent 100%),
          linear-gradient(0deg, ${theme.colors.tech[200]} 0%, ${theme.colors.tech[300]} 100%)
        `,
        backgroundSize: '50px 100%, 100% 100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundImage: 'linear-gradient(0deg, rgba(26, 159, 255, 0.1) 0%, rgba(26, 159, 255, 0.1) 50%, transparent 50%)',
          backgroundSize: '100% 10px',
          opacity: 0.5
        }
      }}
    />
  </Box>
)

function App() {
  const [incomingPlayers, setIncomingPlayers] = useState<string[]>([''])
  const [outgoingPlayers, setOutgoingPlayers] = useState<string[]>([''])
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null)
  const toast = useToast()

  const handleAddPlayer = (side: 'incoming' | 'outgoing') => {
    if (side === 'incoming') {
      setIncomingPlayers([...incomingPlayers, ''])
    } else {
      setOutgoingPlayers([...outgoingPlayers, ''])
    }
  }

  const handleRemovePlayer = (side: 'incoming' | 'outgoing', index: number) => {
    if (side === 'incoming') {
      const newPlayers = incomingPlayers.filter((_, i) => i !== index)
      setIncomingPlayers(newPlayers.length ? newPlayers : [''])
    } else {
      const newPlayers = outgoingPlayers.filter((_, i) => i !== index)
      setOutgoingPlayers(newPlayers.length ? newPlayers : [''])
    }
  }

  const handlePlayerChange = (side: 'incoming' | 'outgoing', index: number, value: string) => {
    if (side === 'incoming') {
      const newPlayers = [...incomingPlayers]
      newPlayers[index] = value
      setIncomingPlayers(newPlayers)
    } else {
      const newPlayers = [...outgoingPlayers]
      newPlayers[index] = value
      setOutgoingPlayers(newPlayers)
    }
  }

  const handleSubmit = async () => {
    const filteredIncoming = incomingPlayers.filter(player => player.trim())
    const filteredOutgoing = outgoingPlayers.filter(player => player.trim())

    if (!filteredIncoming.length || !filteredOutgoing.length) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one player on each side of the trade',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    setAnalysis(null)

    try {
      // Shorter loading time (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const response = await axios.post('http://localhost:8000/api/analyze-trade', {
        incoming_players: filteredIncoming,
        outgoing_players: filteredOutgoing,
      })
      setAnalysis(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze trade. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      console.error('Error analyzing trade:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getGradeColor = (grade: string) => {
    const gradeColors: Record<string, string> = {
      'Excellent': 'green.500',
      'Good': 'blue.500',
      'Fair': 'yellow.500',
      'Poor': 'red.500',
    }
    return gradeColors[grade] || 'gray.500'
  }

  return (
    <ChakraProvider theme={theme}>
      <BackgroundPattern />
      <FootballField />
      <AnimatePresence>
        {isLoading && <LoadingOverlay />}
      </AnimatePresence>
      
      <MotionBox
        minH="100vh"
        py={8}
        position="relative"
        zIndex={2}
      >
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <VStack spacing={8}>
            <MotionBox
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Heading
                fontSize="4xl"
                fontWeight="bold"
                textAlign="center"
                bgGradient="linear(to-r, brand.200, brand.400)"
                bgClip="text"
                letterSpacing="tight"
              >
                Fantasy Football Trade Grader
              </Heading>
            </MotionBox>
            
            <Grid templateColumns="repeat(2, 1fr)" gap={8} w="full">
              <GridItem>
                <MotionVStack
                  spacing={4}
                  bg="tech.200"
                  p={6}
                  borderRadius="lg"
                  boxShadow={`0 4px 6px ${COLORS.boxShadowDefault}`}
                  border="1px solid"
                  borderColor={COLORS.borderDefault}
                  align="stretch"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={cardTransition.initial}
                  whileHover={{ 
                    boxShadow: `0 6px 8px ${COLORS.boxShadowHover}`,
                    borderColor: COLORS.borderHover,
                    transition: cardTransition.hover
                  }}
                >
                  <Text fontSize="xl" fontWeight="semibold" color="brand.300">Players You Receive</Text>
                  <AnimatePresence>
                    {incomingPlayers.map((player, index) => (
                      <MotionBox
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PlayerAutocomplete
                          value={player}
                          onChange={(value) => handlePlayerChange('incoming', index, value)}
                          onRemove={incomingPlayers.length > 1 ? () => handleRemovePlayer('incoming', index) : undefined}
                          placeholder="Enter player name"
                        />
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={() => handleAddPlayer('incoming')}
                    size="sm"
                    variant="ghost"
                    colorScheme="brand"
                    _hover={{ bg: 'tech.300' }}
                  >
                    Add Player
                  </Button>
                </MotionVStack>
              </GridItem>

              <GridItem>
                <MotionVStack
                  spacing={4}
                  bg="tech.200"
                  p={6}
                  borderRadius="lg"
                  boxShadow={`0 4px 6px ${COLORS.boxShadowDefault}`}
                  border="1px solid"
                  borderColor={COLORS.borderDefault}
                  align="stretch"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={cardTransition.initial}
                  whileHover={{ 
                    boxShadow: `0 6px 8px ${COLORS.boxShadowHover}`,
                    borderColor: COLORS.borderHover,
                    transition: cardTransition.hover
                  }}
                >
                  <Text fontSize="xl" fontWeight="semibold" color="brand.300">Players You Give</Text>
                  <AnimatePresence>
                    {outgoingPlayers.map((player, index) => (
                      <MotionBox
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PlayerAutocomplete
                          value={player}
                          onChange={(value) => handlePlayerChange('outgoing', index, value)}
                          onRemove={outgoingPlayers.length > 1 ? () => handleRemovePlayer('outgoing', index) : undefined}
                          placeholder="Enter player name"
                        />
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={() => handleAddPlayer('outgoing')}
                    size="sm"
                    variant="ghost"
                    colorScheme="brand"
                    _hover={{ bg: 'tech.300' }}
                  >
                    Add Player
                  </Button>
                </MotionVStack>
              </GridItem>
            </Grid>

            <MotionBox
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Button 
                colorScheme="blue"
                size="lg"
                onClick={handleSubmit}
                isLoading={isLoading}
                loadingText="Analyzing Trade"
                isDisabled={!incomingPlayers[0] && !outgoingPlayers[0]}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Grade Trade
              </Button>
            </MotionBox>

            <AnimatePresence>
              {analysis && (
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  w="full"
                >
                  <Box
                    bg="white"
                    borderRadius="xl"
                    boxShadow="xl"
                    overflow="hidden"
                    border="1px"
                    borderColor="gray.100"
                  >
                    <Box bg="gray.50" px={6} py={4} borderBottom="1px" borderColor="gray.100">
                      <Text fontSize="lg" fontWeight="bold" color="gray.700">
                        Trade Analysis Results
                      </Text>
                    </Box>

                    <Box p={6}>
                      <Grid templateColumns={{ base: "1fr", md: "auto 1fr" }} gap={8} alignItems="center">
                        <VStack spacing={4} align="center">
                          <GradeCircle grade={analysis.grade} score={analysis.score} />
                          <HStack spacing={2} fontSize="sm" color="gray.600">
                            <Box w={2} h={2} borderRadius="full" bg={analysis.score >= 70 ? 'green.400' : analysis.score >= 50 ? 'yellow.400' : 'red.400'} />
                            <Text>{analysis.score >= 70 ? 'Recommended' : analysis.score >= 50 ? 'Fair' : 'Not Recommended'}</Text>
                          </HStack>
                        </VStack>

                        <Box>
                          <VStack align="stretch" spacing={4}>
                            <Box>
                              <Text fontSize="sm" color="gray.500" mb={1}>
                                Detailed Analysis
                              </Text>
                              <Text color="gray.700" fontSize="md" lineHeight="tall">
                                {analysis.analysis}
                              </Text>
                            </Box>

                            <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={4}>
                              <Box>
                                <Text fontSize="sm" color="gray.500" mb={2}>
                                  Players You Receive
                                </Text>
                                <VStack align="stretch" spacing={1}>
                                  {incomingPlayers
                                    .filter(player => player.trim())
                                    .map((player, index) => (
                                      <HStack key={index} bg="green.50" p={2} borderRadius="md">
                                        <Box w={1} h={4} bg="green.400" borderRadius="full" />
                                        <Text color="gray.700">{player}</Text>
                                      </HStack>
                                    ))}
                                </VStack>
                              </Box>

                              <Box>
                                <Text fontSize="sm" color="gray.500" mb={2}>
                                  Players You Give
                                </Text>
                                <VStack align="stretch" spacing={1}>
                                  {outgoingPlayers
                                    .filter(player => player.trim())
                                    .map((player, index) => (
                                      <HStack key={index} bg="red.50" p={2} borderRadius="md">
                                        <Box w={1} h={4} bg="red.400" borderRadius="full" />
                                        <Text color="gray.700">{player}</Text>
                                      </HStack>
                                    ))}
                                </VStack>
                              </Box>
                            </Grid>
                          </VStack>
                        </Box>
                      </Grid>
                    </Box>
                  </Box>
                </MotionBox>
              )}
            </AnimatePresence>
          </VStack>
        </Container>
      </MotionBox>
    </ChakraProvider>
  )
}

export default App
