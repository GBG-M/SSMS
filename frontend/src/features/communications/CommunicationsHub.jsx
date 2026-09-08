import { useEffect, useState, useRef } from 'react'
import {
  fetchThreads,
  fetchThread,
  createThread,
  sendThreadMessage,
  resolveThread,
  fetchContacts,
  fetchAnnouncements,
  createAnnouncement,
} from '../../services/communicationService'

const CATEGORY_COLORS = {
  ACADEMIC: 'bg-blue-50 text-blue-700 border-blue-200',
  ATTENDANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  BEHAVIOR: 'bg-purple-50 text-purple-700 border-purple-200',
  FINANCE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GENERAL: 'bg-slate-50 text-slate-700 border-slate-200',
}

const PRIORITY_COLORS = {
  NORMAL: 'bg-slate-100 text-slate-700',
  IMPORTANT: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-red-100 text-red-800 animate-pulse',
}

export default function CommunicationsHub({ userRole = 'PARENT', selectedChild = null }) {
  const normalizedRole = (userRole || 'PARENT').toUpperCase()
  const isParent = normalizedRole === 'PARENT'
  const isTeacher = normalizedRole === 'TEACHER'
  const isStaff = normalizedRole === 'ADMIN' || normalizedRole === 'STAFF' || normalizedRole === 'ACADEMIC_COORDINATOR'

  const [viewMode, setViewMode] = useState('threads') // 'threads' | 'notices'
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'OPEN' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Parent child filter toggle
  const [childFilterId, setChildFilterId] = useState(selectedChild?.id ? String(selectedChild.id) : 'all')

  // New Inquiry Modal State
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [contactsData, setContactsData] = useState(null)
  
  // Teacher-specific picker state
  const [selectedSectionId, setSelectedSectionId] = useState('')

  const [inquiryForm, setInquiryForm] = useState({
    student_id: selectedChild?.id || '',
    recipient_id: '',
    subject: '',
    category: 'ACADEMIC',
    initial_message: '',
  })
  const [submittingInquiry, setSubmittingInquiry] = useState(false)

  // Announcements State
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    target_audience: 'ALL',
    priority: 'NORMAL',
  })
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (selectedChild?.id && isParent) {
      setChildFilterId(String(selectedChild.id))
      setInquiryForm((prev) => ({ ...prev, student_id: selectedChild.id }))
    }
  }, [selectedChild?.id, isParent])

  useEffect(() => {
    loadThreads()
    loadContacts()
    loadAnnouncementsList()
  }, [normalizedRole, statusFilter, childFilterId])

  // Live polling for threads and messages every 6 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // 1. Silent thread list refresh
      refreshThreadsSilent()

      // 2. Refresh active conversation stream if open
      if (selectedThread?.id) {
        refreshActiveThreadSilent(selectedThread.id)
      }
    }, 6000)

    return () => clearInterval(pollInterval)
  }, [selectedThread?.id, statusFilter, childFilterId])

  async function loadThreads() {
    try {
      setLoadingThreads(true)
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (isParent && childFilterId !== 'all') params.student = childFilterId
      const data = await fetchThreads(params)
      setThreads(data)
      if (data.length > 0 && !selectedThread) {
        loadThreadDetails(data[0].id)
      } else if (data.length === 0) {
        setSelectedThread(null)
      }
    } catch (err) {
      console.error('Failed to load threads:', err)
      setErrorMessage(err.message)
    } finally {
      setLoadingThreads(false)
    }
  }

  async function refreshThreadsSilent() {
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (isParent && childFilterId !== 'all') params.student = childFilterId
      const data = await fetchThreads(params)
      setThreads(data)
    } catch {}
  }

  async function refreshActiveThreadSilent(threadId) {
    try {
      const detail = await fetchThread(threadId)
      setSelectedThread((prev) => {
        if (!prev || prev.id !== threadId) return prev
        // Only update if messages changed
        if ((prev.messages || []).length !== (detail.messages || []).length) {
          return detail
        }
        return prev
      })
    } catch {}
  }

  async function loadContacts() {
    try {
      const data = await fetchContacts()
      setContactsData(data)
      // Auto-set section if teacher
      if (data?.role === 'teacher' && data.sections?.length > 0) {
        setSelectedSectionId(String(data.sections[0].section_id))
      }
    } catch (err) {
      console.error('Failed to load contacts:', err)
    }
  }

  async function loadAnnouncementsList() {
    try {
      setLoadingAnnouncements(true)
      const data = await fetchAnnouncements()
      setAnnouncements(data)
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  async function loadThreadDetails(threadId) {
    try {
      setLoadingDetail(true)
      const detail = await fetchThread(threadId)
      setSelectedThread(detail)
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t))
      )
    } catch (err) {
      console.error('Failed to load thread details:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleSendReply(e) {
    e.preventDefault()
    if (!replyText.trim() || !selectedThread) return

    try {
      setSendingReply(true)
      const newMsg = await sendThreadMessage(selectedThread.id, replyText)
      setSelectedThread((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg],
        status: prev.status === 'RESOLVED' ? 'IN_PROGRESS' : prev.status,
      }))
      setReplyText('')
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThread.id
            ? {
                ...t,
                status: t.status === 'RESOLVED' ? 'IN_PROGRESS' : t.status,
                last_message: {
                  id: newMsg.id,
                  content: newMsg.content,
                  sender_name: 'You',
                  created_at: newMsg.created_at,
                },
              }
            : t
        )
      )
    } catch (err) {
      alert(err.message || 'Failed to send message.')
    } finally {
      setSendingReply(false)
    }
  }

  async function handleResolveThread() {
    if (!selectedThread) return
    try {
      const updated = await resolveThread(selectedThread.id)
      setSelectedThread(updated)
      setThreads((prev) =>
        prev.map((t) => (t.id === selectedThread.id ? { ...t, status: 'RESOLVED' } : t))
      )
      setSuccessMessage('✓ Inquiry marked as resolved.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to resolve inquiry.')
    }
  }

  async function handleCreateInquiry(e) {
    e.preventDefault()
    if (!inquiryForm.student_id || !inquiryForm.recipient_id || !inquiryForm.subject.trim() || !inquiryForm.initial_message.trim()) {
      alert('Please fill out all required fields.')
      return
    }

    try {
      setSubmittingInquiry(true)
      const newThread = await createThread(inquiryForm)
      setThreads((prev) => [newThread, ...prev])
      setSelectedThread(newThread)
      setShowInquiryModal(false)
      setInquiryForm({
        student_id: selectedChild?.id || '',
        recipient_id: '',
        subject: '',
        category: 'ACADEMIC',
        initial_message: '',
      })
      setSuccessMessage('✓ Inquiry created and dispatched successfully.')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to create inquiry.')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  async function handleCreateBroadcast(e) {
    e.preventDefault()
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) {
      alert('Title and content are required.')
      return
    }

    try {
      setSubmittingBroadcast(true)
      const notice = await createAnnouncement(broadcastForm)
      setAnnouncements((prev) => [notice, ...prev])
      setShowBroadcastModal(false)
      setBroadcastForm({
        title: '',
        content: '',
        target_audience: 'ALL',
        priority: 'NORMAL',
      })
      setSuccessMessage('✓ Official notice published successfully.')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to publish announcement.')
    } finally {
      setSubmittingBroadcast(false)
    }
  }

  // Filter threads by search query
  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (t.subject || '').toLowerCase().includes(q) ||
      (t.student_name || '').toLowerCase().includes(q) ||
      (t.last_message?.content || '').toLowerCase().includes(q)
    )
  })

  // Contacts resolution for Parent
  const currentChildContacts = contactsData?.children?.find(
    (c) => String(c.student_id) === String(inquiryForm.student_id)
  )
  const eligibleRecipientsForParent = currentChildContacts?.eligible_recipients || []

  // Contacts resolution for Teacher
  const currentTeacherSection = contactsData?.sections?.find(
    (s) => String(s.section_id) === String(selectedSectionId)
  )
  const studentsInTeacherSection = currentTeacherSection?.students || []
  const selectedStudentForTeacher = studentsInTeacherSection.find(
    (s) => String(s.student_id) === String(inquiryForm.student_id)
  )
  const eligibleParentsForTeacher = selectedStudentForTeacher?.parents || []

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Tab Toggle and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold">
              💬
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Institutional Communication & Inquiries
            </h2>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
              {normalizedRole}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Secure, two-way threaded inquiries between guardians, teachers, and school administration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode('threads')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === 'threads'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inquiries ({threads.length})
            </button>
            <button
              onClick={() => setViewMode('notices')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === 'notices'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Notice Board ({announcements.length})
            </button>
          </div>

          {/* Primary Action Button based on Role */}
          {isParent && (
            <button
              onClick={() => setShowInquiryModal(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
            >
              ＋ New Inquiry
            </button>
          )}

          {isTeacher && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInquiryModal(true)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
              >
                ＋ Message Parent
              </button>
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
              >
                📢 Post Notice
              </button>
            </div>
          )}

          {isStaff && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInquiryModal(true)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
              >
                ＋ Start Inquiry
              </button>
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
              >
                📢 Post Announcement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          {successMessage}
        </div>
      )}

      {/* VIEW MODE 1: DIRECT THREADED MESSAGING */}
      {viewMode === 'threads' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Left Column: Thread List & Filters */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {/* Search & Status Filters */}
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, student, or messages..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {['all', 'OPEN', 'RESOLVED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                        statusFilter === f
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'All' : f.toLowerCase()}
                    </button>
                  ))}
                </div>

                {/* Parent Children Filter Pills */}
                {isParent && contactsData?.children?.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChildFilterId('all')}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        childFilterId === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      All Kids
                    </button>
                    {contactsData.children.map((k) => (
                      <button
                        key={k.student_id}
                        onClick={() => setChildFilterId(String(k.student_id))}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          String(childFilterId) === String(k.student_id)
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {k.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Thread Cards List */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2 max-h-[520px] pr-1">
              {loadingThreads ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading conversation threads...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No conversation threads found.
                  <div className="mt-2">
                    <button
                      onClick={() => setShowInquiryModal(true)}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      {isParent ? 'Start your first inquiry' : 'Start a new conversation'}
                    </button>
                  </div>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = selectedThread?.id === thread.id
                  return (
                    <div
                      key={thread.id}
                      onClick={() => loadThreadDetails(thread.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.GENERAL
                          }`}
                        >
                          {thread.category_display || thread.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {thread.unread_count > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                              {thread.unread_count}
                            </span>
                          )}
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              thread.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {thread.status_display || thread.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="mt-2 text-xs font-bold text-slate-900 line-clamp-1">
                        {thread.subject}
                      </h4>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Student: <span className="font-semibold text-slate-700">{thread.student_name}</span>
                      </p>

                      {thread.last_message && (
                        <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 italic">
                          "{thread.last_message.content}"
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>By {thread.created_by_name}</span>
                        <span>{new Date(thread.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Thread Message Dialogue */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Loading conversation stream...
              </div>
            ) : selectedThread ? (
              <>
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                          CATEGORY_COLORS[selectedThread.category] || CATEGORY_COLORS.GENERAL
                        }`}
                      >
                        {selectedThread.category_display || selectedThread.category}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          selectedThread.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {selectedThread.status_display || selectedThread.status}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-bold text-slate-900">
                      {selectedThread.subject}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Student: <span className="font-semibold text-slate-800">{selectedThread.student_name}</span>
                      {selectedThread.student_code && (
                        <span className="ml-1 text-slate-400">({selectedThread.student_code})</span>
                      )}
                    </p>
                  </div>

                  {selectedThread.status !== 'RESOLVED' && (
                    <button
                      onClick={handleResolveThread}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition whitespace-nowrap"
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>

                {/* Message Bubble Stream */}
                <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-2 max-h-[380px]">
                  {selectedThread.messages && selectedThread.messages.length > 0 ? (
                    selectedThread.messages.map((msg) => {
                      const isMe = msg.is_mine
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">{msg.sender_name}</span>
                            {msg.sender_role && (
                              <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-600">
                                {msg.sender_role}
                              </span>
                            )}
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div
                            className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No messages recorded in this conversation yet.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Box */}
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    <textarea
                      rows="2"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="self-end rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? 'Sending...' : 'Reply'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <span className="text-4xl mb-2">💬</span>
                <h4 className="text-sm font-bold text-slate-800">Select an Inquiry</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Choose a conversation from the left to review messages and reply, or start a new thread.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INSTITUTIONAL NOTICE BOARD */}
      {viewMode === 'notices' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Notice Board & Circulars</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institutional bulletins published by administration and faculty.
              </p>
            </div>
          </div>

          {loadingAnnouncements ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading notices...</div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No active announcements posted at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.NORMAL
                      }`}
                    >
                      {item.priority_display || item.priority}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Published by {item.author_name}</span>
                    <span>Audience: {item.target_audience_display || item.target_audience}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UNIVERSAL INQUIRY MODAL (PARENT / TEACHER / STAFF) */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isParent
                  ? 'Start New Inquiry / Message Teacher'
                  : isTeacher
                  ? 'Message Parent / Guardian'
                  : 'Start Institutional Inquiry'}
              </h3>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInquiry} className="mt-4 space-y-4 text-xs">
              {/* PARENT WORKFLOW: Select Child -> Select Teacher */}
              {isParent && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student</label>
                    <select
                      value={inquiryForm.student_id}
                      onChange={(e) => {
                        const stuId = e.target.value
                        setInquiryForm((prev) => ({
                          ...prev,
                          student_id: stuId,
                          recipient_id: '',
                        }))
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Select Child --</option>
                      {contactsData?.children?.map((child) => (
                        <option key={child.student_id} value={child.student_id}>
                          {child.name} ({child.grade || child.class_name || 'Enrolled'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Recipient (Teacher or School Office)</label>
                    <select
                      value={inquiryForm.recipient_id}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, recipient_id: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                      disabled={!inquiryForm.student_id}
                    >
                      <option value="">-- Select Recipient --</option>
                      {eligibleRecipientsForParent.map((rec) => (
                        <option key={rec.id} value={rec.id}>
                          {rec.name} — {rec.subject} ({rec.section || rec.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* TEACHER WORKFLOW: Select Class Section -> Select Student -> Select Parent */}
              {isTeacher && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Class Section</label>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => {
                        setSelectedSectionId(e.target.value)
                        setInquiryForm((prev) => ({
                          ...prev,
                          student_id: '',
                          recipient_id: '',
                        }))
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Select Teaching Section --</option>
                      {contactsData?.sections?.map((sec) => (
                        <option key={sec.section_id} value={sec.section_id}>
                          {sec.section_name} ({sec.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student</label>
                    <select
                      value={inquiryForm.student_id}
                      onChange={(e) => {
                        const stuId = e.target.value
                        const studentObj = studentsInTeacherSection.find((s) => String(s.student_id) === String(stuId))
                        const defaultParentId = studentObj?.parents?.[0]?.id || ''
                        setInquiryForm((prev) => ({
                          ...prev,
                          student_id: stuId,
                          recipient_id: defaultParentId,
                        }))
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                      disabled={!selectedSectionId}
                    >
                      <option value="">-- Select Student --</option>
                      {studentsInTeacherSection.map((stu) => (
                        <option key={stu.student_id} value={stu.student_id}>
                          {stu.name} ({stu.student_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent / Guardian</label>
                    <select
                      value={inquiryForm.recipient_id}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, recipient_id: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                      disabled={!inquiryForm.student_id}
                    >
                      <option value="">-- Select Guardian --</option>
                      {eligibleParentsForTeacher.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.relationship || 'Guardian'}) - {p.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* STAFF / ADMIN WORKFLOW */}
              {isStaff && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student Context</label>
                    <select
                      value={inquiryForm.student_id}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, student_id: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Select Student --</option>
                      {contactsData?.students?.map((stu) => (
                        <option key={stu.student_id} value={stu.student_id}>
                          {stu.name} ({stu.student_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Recipient</label>
                    <select
                      value={inquiryForm.recipient_id}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, recipient_id: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Select Teacher or User --</option>
                      {contactsData?.teachers?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Teacher) - {t.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={inquiryForm.category}
                  onChange={(e) => setInquiryForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ACADEMIC">Academic Performance / Grades</option>
                  <option value="ATTENDANCE">Attendance / Absence Leave</option>
                  <option value="BEHAVIOR">Conduct & Well-being</option>
                  <option value="FINANCE">Tuition & Fee Inquiry</option>
                  <option value="GENERAL">General Inquiry</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={inquiryForm.subject}
                  onChange={(e) => setInquiryForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Inquiry regarding science homework"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Initial Message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Message</label>
                <textarea
                  rows="3"
                  value={inquiryForm.initial_message}
                  onChange={(e) => setInquiryForm((prev) => ({ ...prev, initial_message: e.target.value }))}
                  placeholder="Type your message details here..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submittingInquiry ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW ANNOUNCEMENT (TEACHERS / STAFF) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Post Institutional Notice</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Schedule for Midterm Examination"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={broadcastForm.target_audience}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, target_audience: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Everyone (All Roles)</option>
                    <option value="PARENTS">Parents & Guardians</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Announcement Body</label>
                <textarea
                  rows="4"
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Provide full bulletin details..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBroadcast}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submittingBroadcast ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
