import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

type Tab = 'home' | 'resources' | 'chat' | 'profile'
type SearchType = 'all' | 'people' | 'resources' | 'groups'
type ResultKind = Exclude<SearchType, 'all'>
type IconName = keyof typeof MaterialCommunityIcons.glyphMap

type Person = {
  id: string
  name: string
  role: string
  school: string
  city: string
  price: number
  rating: number
  sessions: number
  focus: string
  verified: boolean
  image: string
}

type Resource = {
  id: string
  title: string
  owner: string
  type: string
  subject: string
  downloads: number
  saves: number
  language: string
  level: string
}

type Group = {
  id: string
  name: string
  members: string
  activity: string
  topic: string
}

type FeedItem = {
  id: string
  type: string
  title: string
  body: string
}

type Message = {
  id: string
  mentorId: string
  from: string
  text: string
}

type SearchResult = {
  kind: ResultKind
  title: string
  meta: string
  detail: string
}

type PlannerProfile = {
  target: string
  exams: string
  interests: string
  budget: string
  timeline: string
}

type PlannerAdvice = {
  summary: string
  nextSteps: { title: string; body: string }[]
  suggestedMentors: { id: string; name: string; focus: string }[]
}

type BootstrapPayload = {
  people: Person[]
  resources: Resource[]
  groups: Group[]
  feed: FeedItem[]
  messages: Message[]
  savedResources: string[]
  profile?: {
    interests?: string[]
    budget?: string
  }
}

const API_BASE = Platform.select({
  android: 'http://10.0.2.2:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
})

const fallbackPeople: Person[] = [
  {
    id: 'mentor-aarav',
    name: 'Aarav Mehta',
    role: 'Computer Science senior',
    school: 'IIT Bombay',
    city: 'Mumbai, India',
    price: 499,
    rating: 4.9,
    sessions: 128,
    focus: 'JEE, CS admissions, hostel life',
    verified: true,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'mentor-maya',
    name: 'Maya Rodriguez',
    role: 'Scholarship mentor',
    school: 'University of Toronto',
    city: 'Toronto, Canada',
    price: 899,
    rating: 4.8,
    sessions: 84,
    focus: 'SOP review, scholarships, international transition',
    verified: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'mentor-noah',
    name: 'Noah Williams',
    role: 'Mechanical engineering student',
    school: 'TU Munich',
    city: 'Munich, Germany',
    price: 699,
    rating: 4.7,
    sessions: 61,
    focus: 'Germany admissions, visa, first semester planning',
    verified: false,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
  },
]

const fallbackResources: Resource[] = [
  {
    id: 'res-cs-roadmap',
    title: 'Complete first-year CS roadmap',
    owner: 'Global CS Study Circle',
    type: 'Roadmap',
    subject: 'Computer Science',
    downloads: 18420,
    saves: 2810,
    language: 'English + Hindi',
    level: 'Beginner',
  },
  {
    id: 'res-scholarship-tracker',
    title: 'Scholarship tracker for Indian students',
    owner: 'Maya Rodriguez',
    type: 'Spreadsheet',
    subject: 'Admissions',
    downloads: 9720,
    saves: 1432,
    language: 'English',
    level: 'Class 12 and gap year',
  },
  {
    id: 'res-physics',
    title: 'Physics formulas and solved problems',
    owner: 'Delhi Open Notes',
    type: 'Notes',
    subject: 'Physics',
    downloads: 35100,
    saves: 5202,
    language: 'Hindi + English',
    level: 'Class 11-12',
  },
]

const fallbackGroups: Group[] = [
  {
    id: 'group-fall-2027',
    name: 'Fall 2027 Admissions India',
    members: '18.4K',
    activity: '312 posts today',
    topic: 'Applications, exams, financial aid',
  },
  {
    id: 'group-women-stem',
    name: 'Women in STEM peer network',
    members: '42.9K',
    activity: '86 mentors online',
    topic: 'Mentorship, projects, internships',
  },
]

const fallbackFeed: FeedItem[] = [
  {
    id: 'feed-match',
    type: 'match',
    title: '3 verified seniors can guide you on CS admissions',
    body: 'Based on your interest in computer science, scholarships, and Indian entrance exams.',
  },
  {
    id: 'feed-resource',
    type: 'resource',
    title: 'Physics formulas and solved problems is trending',
    body: 'Available in Hindi and English for low-data download.',
  },
  {
    id: 'feed-event',
    type: 'event',
    title: 'Live group session: choosing the right college after 12th',
    body: 'Hosted by students from IIT Bombay, DU, and Ashoka.',
  },
]

const fallbackMessages: Message[] = [
  { id: 'msg-1', mentorId: 'mentor-aarav', from: 'Aarav', text: 'Tell me your target colleges and exam status.' },
  { id: 'msg-2', mentorId: 'mentor-aarav', from: 'You', text: 'I want honest advice about CS options after 12th.' },
]

const navItems: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'home', label: 'Home', icon: 'home-variant-outline' },
  { tab: 'resources', label: 'Library', icon: 'book-open-variant' },
  { tab: 'chat', label: 'Chats', icon: 'message-text-outline' },
  { tab: 'profile', label: 'Plan', icon: 'account-circle-outline' },
]

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function apiUrl(path: string) {
  return `${API_BASE}${path}`
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('all')
  const [mentors, setMentors] = useState<Person[]>(fallbackPeople)
  const [resources, setResources] = useState<Resource[]>(fallbackResources)
  const [groups, setGroups] = useState<Group[]>(fallbackGroups)
  const [feed, setFeed] = useState<FeedItem[]>(fallbackFeed)
  const [saved, setSaved] = useState<string[]>(['Complete first-year CS roadmap'])
  const [selectedMentor, setSelectedMentor] = useState<Person>(fallbackPeople[0])
  const [messages, setMessages] = useState<Message[]>(fallbackMessages)
  const [draft, setDraft] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceSubject, setResourceSubject] = useState('Admissions')
  const [plannerProfile, setPlannerProfile] = useState<PlannerProfile>({
    target: 'Computer Science after Class 12',
    exams: 'JEE, CUET',
    interests: 'Computer Science, scholarships, peer mentorship',
    budget: 'Medium',
    timeline: 'next 6 months',
  })
  const [plannerAdvice, setPlannerAdvice] = useState<PlannerAdvice | null>(null)
  const [plannerLoading, setPlannerLoading] = useState(false)

  useEffect(() => {
    fetch(apiUrl('/api/bootstrap'))
      .then((response) => response.json() as Promise<BootstrapPayload>)
      .then((data) => {
        setMentors(data.people)
        setResources(data.resources)
        setGroups(data.groups)
        setFeed(data.feed)
        setMessages(data.messages)
        setSaved(data.savedResources)
        setSelectedMentor(data.people[0] ?? fallbackPeople[0])
        setPlannerProfile((current) => ({
          ...current,
          interests: data.profile?.interests?.join(', ') ?? current.interests,
          budget: data.profile?.budget ?? current.budget,
        }))
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    fetch(apiUrl(`/api/messages/${selectedMentor.id}`))
      .then((response) => response.json() as Promise<{ messages: Message[] }>)
      .then((data) => setMessages(data.messages))
      .catch(() => undefined)
  }, [selectedMentor.id])

  useEffect(() => {
    const normalized = query.trim()
    if (!normalized) {
      setSearchResults([])
      return
    }

    fetch(apiUrl(`/api/search?q=${encodeURIComponent(normalized)}&type=${searchType}`))
      .then((response) => response.json() as Promise<{ results: SearchResult[] }>)
      .then((data) => setSearchResults(data.results))
      .catch(() => setSearchResults([]))
  }, [query, searchType])

  const toggleSave = (title: string) => {
    setSaved((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]))
    fetch(apiUrl('/api/resources/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
      .then((response) => response.json() as Promise<{ savedResources: string[] }>)
      .then((data) => setSaved(data.savedResources))
      .catch(() => undefined)
  }

  const shareResource = () => {
    const title = resourceTitle.trim()
    if (!title) {
      Alert.alert('Add a title', 'Give your resource a clear title before sharing.')
      return
    }

    fetch(apiUrl('/api/resources'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject: resourceSubject }),
    })
      .then((response) => response.json() as Promise<{ resource: Resource }>)
      .then((data) => {
        setResources((current) => [data.resource, ...current])
        setResourceTitle('')
        Alert.alert('Shared', 'Your resource is now in the BridgeEd library.')
      })
      .catch(() => Alert.alert('Could not share', 'Start the API server and try again.'))
  }

  const sendMessage = () => {
    const text = draft.trim()
    if (!text) return
    const optimisticMessage: Message = {
      id: `local-${Date.now()}`,
      mentorId: selectedMentor.id,
      from: 'You',
      text,
    }
    setMessages((current) => [...current, optimisticMessage])
    setDraft('')

    fetch(apiUrl('/api/messages'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: selectedMentor.id, text }),
    })
      .then((response) => response.json() as Promise<{ message: Message }>)
      .then((data) => {
        setMessages((current) => current.map((message) => (message.id === optimisticMessage.id ? data.message : message)))
      })
      .catch(() => undefined)
  }

  const requestSession = (mentor: Person) => {
    fetch(apiUrl('/api/bookings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: mentor.id }),
    })
      .then(() => Alert.alert('Session requested', `${mentor.name} will see your request.`))
      .catch(() => Alert.alert('Saved locally', 'Start the API server to store session requests.'))
  }

  const createPlan = () => {
    setPlannerLoading(true)
    fetch(apiUrl('/api/ai/advice'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plannerProfile),
    })
      .then((response) => response.json() as Promise<{ advice: PlannerAdvice }>)
      .then((data) => setPlannerAdvice(data.advice))
      .catch(() => Alert.alert('Planner unavailable', 'Start the API server and try again.'))
      .finally(() => setPlannerLoading(false))
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.shell}>
          <Header query={query} setQuery={setQuery} />
          {query ? (
            <SearchScreen
              results={searchResults}
              searchType={searchType}
              setSearchType={setSearchType}
              fallbackGroups={groups}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  feed={feed}
                  mentors={mentors}
                  selectedMentor={selectedMentor}
                  setActiveTab={setActiveTab}
                  setSelectedMentor={setSelectedMentor}
                  requestSession={requestSession}
                />
              )}
              {activeTab === 'resources' && (
                <ResourcesScreen
                  resourceSubject={resourceSubject}
                  resourceTitle={resourceTitle}
                  resources={resources}
                  saved={saved}
                  setResourceSubject={setResourceSubject}
                  setResourceTitle={setResourceTitle}
                  shareResource={shareResource}
                  toggleSave={toggleSave}
                />
              )}
              {activeTab === 'chat' && (
                <ChatScreen
                  draft={draft}
                  mentors={mentors}
                  messages={messages}
                  selectedMentor={selectedMentor}
                  sendMessage={sendMessage}
                  setDraft={setDraft}
                  setSelectedMentor={setSelectedMentor}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileScreen
                  createPlan={createPlan}
                  plannerAdvice={plannerAdvice}
                  plannerLoading={plannerLoading}
                  plannerProfile={plannerProfile}
                  setPlannerProfile={setPlannerProfile}
                />
              )}
            </>
          )}
          <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

function Header({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <MaterialCommunityIcons color={colors.greenDark} name="school-outline" size={24} />
        </View>
        <View>
          <Text style={styles.brandName}>BridgeEd</Text>
          <Text style={styles.brandCaption}>Educational network</Text>
        </View>
      </View>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons color={colors.muted} name="magnify" size={20} />
        <TextInput
          placeholder="Search mentors, notes, groups"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
    </View>
  )
}

function HomeScreen({
  feed,
  mentors,
  selectedMentor,
  setActiveTab,
  setSelectedMentor,
  requestSession,
}: {
  feed: FeedItem[]
  mentors: Person[]
  selectedMentor: Person
  setActiveTab: (tab: Tab) => void
  setSelectedMentor: (mentor: Person) => void
  requestSession: (mentor: Person) => void
}) {
  return (
    <ScreenScroll>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Students helping students</Text>
        <Text style={styles.heroTitle}>Find guidance, resources, and community before big education decisions.</Text>
        <Text style={styles.heroBody}>
          Connect with current students, save shared study material, and plan admissions with real peer context.
        </Text>
        <View style={styles.actionRow}>
          <PrimaryButton icon="message-text-outline" label="Start chat" onPress={() => setActiveTab('chat')} />
          <SecondaryButton icon="book-open-variant" label="Library" onPress={() => setActiveTab('resources')} />
        </View>
      </View>

      <SectionTitle kicker="Today" title="Helpful updates" />
      {feed.map((item) => (
        <View key={item.id} style={styles.feedCard}>
          <View style={[styles.feedIcon, item.type === 'event' && styles.feedIconCoral]}>
            <MaterialCommunityIcons color={colors.panel} name="creation" size={18} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        </View>
      ))}

      <SectionTitle kicker="Peer guidance" title="Mentors you can talk to" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {mentors.map((mentor) => (
          <Pressable
            key={mentor.id}
            onPress={() => setSelectedMentor(mentor)}
            style={[styles.mentorCard, selectedMentor.id === mentor.id && styles.selectedCard]}
          >
            <Image source={{ uri: mentor.image }} style={styles.mentorImageLarge} />
            <Text style={styles.cardTitle}>{mentor.name}</Text>
            <Text style={styles.cardMeta}>{mentor.school}</Text>
            <Text style={styles.cardBody}>{mentor.focus}</Text>
            <View style={styles.inlineMeta}>
              <MaterialCommunityIcons color={colors.gold} name="star" size={15} />
              <Text style={styles.cardMeta}>
                {mentor.rating} · {mentor.sessions} sessions
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sessionCard}>
        <Text style={styles.eyebrow}>Guidance session</Text>
        <Text style={styles.sectionTitle}>{selectedMentor.name}</Text>
        <Text style={styles.cardBody}>
          {selectedMentor.role} · {selectedMentor.city}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.cardMeta}>30 minute session</Text>
          <Text style={styles.price}>{money(selectedMentor.price)}</Text>
        </View>
        <PrimaryButton icon="calendar-check-outline" label="Request session" onPress={() => requestSession(selectedMentor)} />
      </View>
    </ScreenScroll>
  )
}

function ResourcesScreen({
  resources,
  saved,
  resourceTitle,
  resourceSubject,
  setResourceTitle,
  setResourceSubject,
  shareResource,
  toggleSave,
}: {
  resources: Resource[]
  saved: string[]
  resourceTitle: string
  resourceSubject: string
  setResourceTitle: (value: string) => void
  setResourceSubject: (value: string) => void
  shareResource: () => void
  toggleSave: (title: string) => void
}) {
  return (
    <ScreenScroll>
      <SectionTitle kicker="Library" title="Share what helped you learn" />
      <View style={styles.formCard}>
        <TextInput
          placeholder="Resource title"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={resourceTitle}
          onChangeText={setResourceTitle}
        />
        <TextInput
          placeholder="Subject"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={resourceSubject}
          onChangeText={setResourceSubject}
        />
        <PrimaryButton icon="upload-outline" label="Share resource" onPress={shareResource} />
      </View>

      {resources.map((resource) => (
        <View key={resource.id} style={styles.resourceCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.pill}>{resource.type}</Text>
            <Pressable onPress={() => toggleSave(resource.title)} style={styles.iconButton}>
              <MaterialCommunityIcons
                color={saved.includes(resource.title) ? colors.gold : colors.green}
                name={saved.includes(resource.title) ? 'bookmark' : 'bookmark-outline'}
                size={22}
              />
            </Pressable>
          </View>
          <Text style={styles.cardTitle}>{resource.title}</Text>
          <Text style={styles.cardBody}>{resource.owner}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>{resource.subject}</Text>
            <Text style={styles.tag}>{resource.level}</Text>
            <Text style={styles.tag}>{resource.language}</Text>
          </View>
          <Text style={styles.cardMeta}>
            {resource.downloads.toLocaleString()} downloads · {resource.saves.toLocaleString()} saves
          </Text>
        </View>
      ))}
    </ScreenScroll>
  )
}

function ChatScreen({
  mentors,
  selectedMentor,
  setSelectedMentor,
  messages,
  draft,
  setDraft,
  sendMessage,
}: {
  mentors: Person[]
  selectedMentor: Person
  setSelectedMentor: (mentor: Person) => void
  messages: Message[]
  draft: string
  setDraft: (value: string) => void
  sendMessage: () => void
}) {
  return (
    <View style={styles.chatScreen}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.threadRail}>
        {mentors.map((mentor) => (
          <Pressable
            key={mentor.id}
            onPress={() => setSelectedMentor(mentor)}
            style={[styles.threadChip, selectedMentor.id === mentor.id && styles.threadChipActive]}
          >
            <Image source={{ uri: mentor.image }} style={styles.avatar} />
            <Text style={styles.threadName}>{mentor.name.split(' ')[0]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.chatHeader}>
        <Image source={{ uri: selectedMentor.image }} style={styles.avatarLarge} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{selectedMentor.name}</Text>
          <Text style={styles.cardMeta}>{selectedMentor.school}</Text>
        </View>
        <MaterialCommunityIcons color={colors.green} name="video-outline" size={24} />
      </View>

      <ScrollView style={styles.messageList} showsVerticalScrollIndicator={false}>
        {messages.map((message, index) => (
          <View key={`${message.id}-${index}`} style={[styles.messageBubble, message.from === 'You' && styles.myMessage]}>
            <Text style={[styles.messageAuthor, message.from === 'You' && styles.myMessageText]}>{message.from}</Text>
            <Text style={[styles.messageText, message.from === 'You' && styles.myMessageText]}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          placeholder="Ask about admissions, fees, campus life"
          placeholderTextColor={colors.muted}
          style={styles.composerInput}
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable onPress={sendMessage} style={styles.sendButton}>
          <MaterialCommunityIcons color={colors.panel} name="send" size={20} />
        </Pressable>
      </View>
    </View>
  )
}

function ProfileScreen({
  plannerProfile,
  setPlannerProfile,
  createPlan,
  plannerAdvice,
  plannerLoading,
}: {
  plannerProfile: PlannerProfile
  setPlannerProfile: (value: PlannerProfile) => void
  createPlan: () => void
  plannerAdvice: PlannerAdvice | null
  plannerLoading: boolean
}) {
  const update = (field: keyof PlannerProfile, value: string) => {
    setPlannerProfile({ ...plannerProfile, [field]: value })
  }

  return (
    <ScreenScroll>
      <View style={styles.profileCard}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=80' }}
          style={styles.profileImage}
        />
        <Text style={styles.eyebrow}>Student profile</Text>
        <Text style={styles.heroTitleSmall}>Praveen Kumar Jha</Text>
        <Text style={styles.cardBody}>Class 12 student exploring computer science, scholarships, and accessible learning.</Text>
      </View>

      <View style={styles.statsGrid}>
        <Stat value="12" label="Saved" />
        <Stat value="4" label="Chats" />
        <Stat value="2" label="Groups" />
        <Stat value="86%" label="Trust" />
      </View>

      <SectionTitle kicker="Admission planner" title="Shape your next steps" />
      <View style={styles.formCard}>
        <PlannerInput label="Target" value={plannerProfile.target} onChangeText={(value) => update('target', value)} />
        <PlannerInput label="Exams" value={plannerProfile.exams} onChangeText={(value) => update('exams', value)} />
        <PlannerInput label="Interests" value={plannerProfile.interests} onChangeText={(value) => update('interests', value)} />
        <PlannerInput label="Budget" value={plannerProfile.budget} onChangeText={(value) => update('budget', value)} />
        <PlannerInput label="Timeline" value={plannerProfile.timeline} onChangeText={(value) => update('timeline', value)} />
        <PrimaryButton icon="map-check-outline" label={plannerLoading ? 'Preparing...' : 'Create plan'} onPress={createPlan} />
      </View>

      {plannerLoading && <ActivityIndicator color={colors.green} style={styles.loader} />}
      {plannerAdvice && (
        <View style={styles.planCard}>
          <Text style={styles.cardTitle}>{plannerAdvice.summary}</Text>
          {plannerAdvice.nextSteps.map((step) => (
            <View key={step.title} style={styles.planStep}>
              <MaterialCommunityIcons color={colors.green} name="check-circle-outline" size={22} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{step.title}</Text>
                <Text style={styles.cardBody}>{step.body}</Text>
              </View>
            </View>
          ))}
          {plannerAdvice.suggestedMentors.length > 0 && (
            <View style={styles.mentorSuggestions}>
              <Text style={styles.cardTitle}>Suggested mentors</Text>
              {plannerAdvice.suggestedMentors.map((mentor) => (
                <Text key={mentor.id} style={styles.cardBody}>
                  {mentor.name}: {mentor.focus}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScreenScroll>
  )
}

function SearchScreen({
  results,
  searchType,
  setSearchType,
  fallbackGroups,
}: {
  results: SearchResult[]
  searchType: SearchType
  setSearchType: (type: SearchType) => void
  fallbackGroups: Group[]
}) {
  const visibleResults =
    results.length > 0
      ? results
      : fallbackGroups.map((group) => ({
          kind: 'groups' as const,
          title: group.name,
          meta: group.members,
          detail: 'Try a broader search term',
        }))

  return (
    <ScreenScroll>
      <SectionTitle kicker="Explore BridgeEd" title={results.length ? `${results.length} helpful matches` : 'Keep exploring'} />
      <View style={styles.segmented}>
        {(['all', 'people', 'resources', 'groups'] as SearchType[]).map((type) => (
          <Pressable
            key={type}
            onPress={() => setSearchType(type)}
            style={[styles.segmentButton, searchType === type && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, searchType === type && styles.segmentTextActive]}>{type}</Text>
          </Pressable>
        ))}
      </View>
      {visibleResults.map((result) => (
        <View key={`${result.kind}-${result.title}`} style={styles.resultCard}>
          <Text style={styles.pill}>{result.kind}</Text>
          <Text style={styles.cardTitle}>{result.title}</Text>
          <Text style={styles.cardBody}>
            {result.meta} · {result.detail}
          </Text>
        </View>
      ))}
    </ScreenScroll>
  )
}

function BottomTabs({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return (
    <View style={styles.bottomTabs}>
      {navItems.map((item) => {
        const active = activeTab === item.tab
        return (
          <Pressable key={item.tab} onPress={() => setActiveTab(item.tab)} style={styles.tabButton}>
            <MaterialCommunityIcons color={active ? colors.gold : colors.softText} name={item.icon} size={24} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.eyebrow}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function PrimaryButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <MaterialCommunityIcons color={colors.panel} name={icon} size={19} />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  )
}

function SecondaryButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <MaterialCommunityIcons color={colors.green} name={icon} size={19} />
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  )
}

function PlannerInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor={colors.muted} />
    </View>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.cardMeta}>{label}</Text>
    </View>
  )
}

const colors = {
  bg: '#F4F1EA',
  panel: '#FFFDFA',
  panelSoft: '#F8F4EC',
  ink: '#17211E',
  muted: '#6D746F',
  softText: '#D7CAB8',
  line: '#E1D8CA',
  green: '#17624F',
  greenDark: '#102820',
  coral: '#B85B44',
  gold: '#B9862D',
  blue: '#315F86',
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.greenDark,
  },
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: colors.greenDark,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C36D',
  },
  brandName: {
    color: colors.panel,
    fontSize: 22,
    fontWeight: '800',
  },
  brandCaption: {
    color: colors.softText,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 112,
  },
  heroCard: {
    gap: 14,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.greenDark,
  },
  eyebrow: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.panel,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroTitleSmall: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroBody: {
    color: colors.softText,
    fontSize: 15,
    lineHeight: 23,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.green,
  },
  primaryButtonText: {
    color: colors.panel,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  secondaryButtonText: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeading: {
    gap: 4,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
  },
  feedCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  feedIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.blue,
  },
  feedIconCoral: {
    backgroundColor: colors.coral,
  },
  flex: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  cardBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  mentorCard: {
    width: 230,
    gap: 8,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.panel,
  },
  selectedCard: {
    borderColor: colors.green,
    backgroundColor: '#EEF7F2',
  },
  mentorImageLarge: {
    width: 62,
    height: 62,
    borderRadius: 16,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sessionCard: {
    gap: 12,
    padding: 18,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  price: {
    color: colors.green,
    fontSize: 20,
    fontWeight: '800',
  },
  formCard: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.panel,
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.panelSoft,
    color: colors.ink,
    fontSize: 15,
  },
  resourceCard: {
    gap: 9,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.panel,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    color: colors.green,
    backgroundColor: colors.panelSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    color: colors.muted,
    backgroundColor: colors.panelSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  chatScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 92,
  },
  threadRail: {
    maxHeight: 92,
    marginTop: 16,
  },
  threadChip: {
    width: 82,
    alignItems: 'center',
    gap: 6,
    padding: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.panel,
  },
  threadChipActive: {
    borderColor: colors.green,
    backgroundColor: '#EEF7F2',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 15,
  },
  threadName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  messageList: {
    flex: 1,
    paddingTop: 16,
  },
  messageBubble: {
    maxWidth: '82%',
    alignSelf: 'flex-start',
    gap: 4,
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: colors.panel,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.green,
  },
  messageAuthor: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  messageText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.panel,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.panel,
    color: colors.ink,
  },
  sendButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.green,
  },
  profileCard: {
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.panel,
  },
  profileImage: {
    width: '100%',
    height: 170,
    borderRadius: 16,
    marginBottom: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.panel,
  },
  statValue: {
    color: colors.green,
    fontSize: 22,
    fontWeight: '900',
  },
  loader: {
    marginTop: 18,
  },
  planCard: {
    gap: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.panel,
  },
  planStep: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  mentorSuggestions: {
    gap: 4,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.panelSoft,
  },
  segmented: {
    flexDirection: 'row',
    gap: 6,
    padding: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.panel,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: colors.green,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  segmentTextActive: {
    color: colors.panel,
  },
  resultCard: {
    gap: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  bottomTabs: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.greenDark,
  },
  tabButton: {
    minWidth: 66,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    color: colors.softText,
    fontSize: 11,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.gold,
  },
})
