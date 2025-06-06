import {
  Input,
  Box,
  List,
  ListItem,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  useOutsideClick,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { debounce } from 'lodash'

interface Player {
  name: string
  team: string
  position: string
  display: string
}

interface PlayerAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onRemove?: () => void
  placeholder?: string
}

export const PlayerAutocomplete = ({
  value,
  onChange,
  onRemove,
  placeholder = 'Enter player name'
}: PlayerAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Player[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useOutsideClick({
    ref: ref,
    handler: () => {
      setIsOpen(false)
      setError(null)
    },
  })

  const fetchSuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`http://localhost:8000/api/players/search?q=${encodeURIComponent(query)}`)
      setSuggestions(response.data)
    } catch (error) {
      console.error('Error fetching player suggestions:', error)
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || error.message
        setError(`Error: ${message}`)
      } else {
        setError('An unexpected error occurred')
      }
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedFetch = debounce(fetchSuggestions, 300)

  useEffect(() => {
    return () => {
      debouncedFetch.cancel()
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    debouncedFetch(newValue)
  }

  const handleSelect = (player: Player) => {
    setInputValue(player.display)
    onChange(player.display)
    setIsOpen(false)
    setSuggestions([])
    setError(null)
  }

  return (
    <Box position="relative" ref={ref}>
      <InputGroup>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          bg="tech.200"
          _hover={{ bg: 'tech.300' }}
          _focus={{ bg: 'tech.300', borderColor: 'brand.400' }}
          isInvalid={!!error}
        />
        {onRemove && inputValue && (
          <InputRightElement>
            <IconButton
              aria-label="Remove player"
              icon={loading ? <Spinner size="sm" /> : <CloseIcon />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => {
                setInputValue('')
                onChange('')
                onRemove()
                setError(null)
              }}
            />
          </InputRightElement>
        )}
      </InputGroup>

      {error && (
        <Alert status="error" mt={2} borderRadius="md" size="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {isOpen && suggestions.length > 0 && (
        <List
          position="absolute"
          top={error ? '100px' : '100%'}
          left={0}
          right={0}
          mt={2}
          bg="tech.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxH="300px"
          overflowY="auto"
          border="1px solid"
          borderColor="tech.300"
        >
          {suggestions.map((player, index) => (
            <ListItem
              key={index}
              px={4}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'tech.300' }}
              onClick={() => handleSelect(player)}
            >
              <Text color="whiteAlpha.900">{player.name}</Text>
              <Text fontSize="sm" color="whiteAlpha.700">
                {player.team} - {player.position}
              </Text>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
} 