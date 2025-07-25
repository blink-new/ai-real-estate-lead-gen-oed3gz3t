import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Mail, MapPin, Clock, Star, TrendingUp, Users, Target, ExternalLink, Copy } from 'lucide-react'
import { blink } from '@/blink/client'

interface CapturedLead {
  id: string
  name: string
  email: string
  phone: string
  propertyType: string
  timeline: string
  budget: string
  location: string
  motivation: string
  source: string
  score: number
  status: 'new' | 'contacted' | 'qualified' | 'converted'
  capturedAt: string
  aiInsights: string
  nextAction: string
}

const LeadCapture: React.FC = () => {
  const [activeTab, setActiveTab] = useState('capture-forms')
  const [capturedLeads, setCapturedLeads] = useState<CapturedLead[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadCapturedLeads = async (userId: string) => {
    try {
      const leads = await blink.db.capturedLeads.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      
      // Transform database leads to component format
      const transformedLeads = leads.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        propertyType: lead.propertyType || '',
        timeline: lead.timeline || '',
        budget: lead.budget || '',
        location: lead.location || '',
        motivation: lead.motivation || '',
        source: lead.source || 'Direct',
        score: lead.score || 0,
        status: lead.status || 'new',
        capturedAt: lead.createdAt,
        aiInsights: lead.aiInsights || '',
        nextAction: lead.nextAction || ''
      }))
      
      setCapturedLeads(transformedLeads)
    } catch (error) {
      console.error('Error loading leads:', error)
    }
  }

  // Load user and leads on component mount
  React.useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      if (state.user) {
        loadCapturedLeads(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  const [formData, setFormData] = useState({
    formName: '',
    targetAudience: '',
    propertyType: '',
    location: '',
    priceRange: '',
    leadMagnet: ''
  })

  const [generatedForms, setGeneratedForms] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateForms = async () => {
    setIsGenerating(true)
    try {
      const { object: formsData } = await blink.ai.generateObject({
        prompt: `Create 3 high-converting lead capture forms for real estate agents targeting ${formData.targetAudience} interested in ${formData.propertyType} properties in ${formData.location} with budget ${formData.priceRange}. Each form should have a compelling headline, description, and lead magnet offer.`,
        schema: {
          type: 'object',
          properties: {
            forms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  headline: { type: 'string' },
                  description: { type: 'string' },
                  leadMagnet: { type: 'string' },
                  targetAudience: { type: 'string' },
                  conversionTips: { type: 'array', items: { type: 'string' } },
                  embedCode: { type: 'string' },
                  landingPageUrl: { type: 'string' }
                }
              }
            }
          },
          required: ['forms']
        }
      })

      // Save forms to database
      if (user && formsData.forms) {
        for (const form of formsData.forms) {
          await blink.db.leadCaptureForms.create({
            id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            formName: form.name,
            headline: form.headline,
            description: form.description,
            leadMagnet: form.leadMagnet,
            targetAudience: form.targetAudience,
            propertyType: formData.propertyType,
            location: formData.location,
            priceRange: formData.priceRange,
            embedCode: form.embedCode || '',
            landingPageUrl: form.landingPageUrl || '',
            conversionTips: JSON.stringify(form.conversionTips || [])
          })
        }
      }

      setGeneratedForms(formsData.forms)
    } catch (error) {
      console.error('Error generating forms:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Add a demo lead (for testing purposes)
  const addDemoLead = async () => {
    if (!user) return

    const demoLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      propertyType: 'Single Family Home',
      timeline: '3-6 months',
      budget: '$400,000 - $500,000',
      location: 'Miami, FL',
      motivation: 'First-time homebuyer, growing family',
      source: 'Landing Page Form',
      score: 92,
      status: 'new',
      aiInsights: 'High-intent buyer with pre-approval likely. Strong motivation due to family growth.',
      nextAction: 'Schedule property viewing call within 24 hours'
    }

    try {
      await blink.db.capturedLeads.create(demoLead)
      await loadCapturedLeads(user.id)
    } catch (error) {
      console.error('Error adding demo lead:', error)
    }
  }

  const handleQualifyLead = async (leadId: string) => {
    const lead = capturedLeads.find(l => l.id === leadId)
    if (!lead || !user) return

    try {
      const { object: qualification } = await blink.ai.generateObject({
        prompt: `Analyze this real estate lead and provide qualification insights: Name: ${lead.name}, Property Type: ${lead.propertyType}, Timeline: ${lead.timeline}, Budget: ${lead.budget}, Motivation: ${lead.motivation}. Provide detailed qualification analysis.`,
        schema: {
          type: 'object',
          properties: {
            qualificationScore: { type: 'number' },
            buyerReadiness: { type: 'string' },
            recommendedActions: { type: 'array', items: { type: 'string' } },
            riskFactors: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array', items: { type: 'string' } },
            nextSteps: { type: 'string' }
          }
        }
      })

      const updatedInsights = `Buyer Readiness: ${qualification.buyerReadiness}. ${qualification.opportunities.join(' ')}`
      
      // Update lead in database
      await blink.db.capturedLeads.update(leadId, {
        score: qualification.qualificationScore,
        aiInsights: updatedInsights,
        nextAction: qualification.nextSteps,
        status: 'qualified',
        updatedAt: new Date().toISOString()
      })

      // Update local state
      setCapturedLeads(prev => prev.map(l => 
        l.id === leadId 
          ? { 
              ...l, 
              score: qualification.qualificationScore,
              aiInsights: updatedInsights,
              nextAction: qualification.nextSteps,
              status: 'qualified' as const
            }
          : l
      ))
    } catch (error) {
      console.error('Error qualifying lead:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your lead capture system...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Lead Capture & Qualification</h2>
          <p className="text-gray-600 mt-2">Create compliant lead capture forms and qualify real prospects with AI</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="w-4 h-4 mr-2" />
            {capturedLeads.length} Captured Leads
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Target className="w-4 h-4 mr-2" />
            {capturedLeads.filter(l => l.score >= 80).length} High-Quality
          </Badge>
          <Button variant="outline" size="sm" onClick={addDemoLead}>
            Add Demo Lead
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capture-forms">Lead Capture Forms</TabsTrigger>
          <TabsTrigger value="captured-leads">Captured Leads</TabsTrigger>
          <TabsTrigger value="qualification">AI Qualification</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="capture-forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Generate Lead Capture Forms
              </CardTitle>
              <CardDescription>
                Create high-converting, compliant lead capture forms tailored to your target audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formName">Campaign Name</Label>
                  <Input
                    id="formName"
                    placeholder="e.g., Miami Luxury Homes Campaign"
                    value={formData.formName}
                    onChange={(e) => setFormData({...formData, formName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select value={formData.targetAudience} onValueChange={(value) => setFormData({...formData, targetAudience: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first-time-buyers">First-Time Buyers</SelectItem>
                      <SelectItem value="luxury-buyers">Luxury Home Buyers</SelectItem>
                      <SelectItem value="investors">Real Estate Investors</SelectItem>
                      <SelectItem value="sellers">Property Sellers</SelectItem>
                      <SelectItem value="downsizers">Downsizers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => setFormData({...formData, propertyType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single Family Homes</SelectItem>
                      <SelectItem value="condos">Condominiums</SelectItem>
                      <SelectItem value="townhomes">Townhomes</SelectItem>
                      <SelectItem value="luxury">Luxury Properties</SelectItem>
                      <SelectItem value="investment">Investment Properties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Target Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Miami, FL"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Select value={formData.priceRange} onValueChange={(value) => setFormData({...formData, priceRange: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-300k">Under $300K</SelectItem>
                      <SelectItem value="300k-500k">$300K - $500K</SelectItem>
                      <SelectItem value="500k-750k">$500K - $750K</SelectItem>
                      <SelectItem value="750k-1m">$750K - $1M</SelectItem>
                      <SelectItem value="over-1m">Over $1M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="leadMagnet">Lead Magnet Type</Label>
                  <Select value={formData.leadMagnet} onValueChange={(value) => setFormData({...formData, leadMagnet: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead magnet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market-report">Market Report</SelectItem>
                      <SelectItem value="buyer-guide">Buyer's Guide</SelectItem>
                      <SelectItem value="home-valuation">Free Home Valuation</SelectItem>
                      <SelectItem value="investment-analysis">Investment Analysis</SelectItem>
                      <SelectItem value="neighborhood-guide">Neighborhood Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleGenerateForms} 
                disabled={isGenerating || !formData.targetAudience || !formData.location}
                className="w-full"
              >
                {isGenerating ? 'Generating Forms...' : 'Generate AI Lead Capture Forms'}
              </Button>
            </CardContent>
          </Card>

          {generatedForms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedForms.map((form, index) => (
                <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <CardDescription className="text-sm">{form.targetAudience}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-blue-600">{form.headline}</h4>
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-amber-800">Lead Magnet:</p>
                      <p className="text-sm text-amber-700">{form.leadMagnet}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Conversion Tips:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {form.conversionTips?.map((tip: string, tipIndex: number) => (
                          <li key={tipIndex} className="flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(form.embedCode || '')}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="captured-leads" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capturedLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      {lead.score}/100
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(lead.capturedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {lead.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {lead.location}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-700">Property Interest:</p>
                    <p className="text-sm">{lead.propertyType} • {lead.budget}</p>
                    <p className="text-xs text-gray-600 mt-1">Timeline: {lead.timeline}</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-blue-700">AI Insights:</p>
                    <p className="text-sm text-blue-600">{lead.aiInsights}</p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-green-700">Next Action:</p>
                    <p className="text-sm text-green-600">{lead.nextAction}</p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="qualification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                AI Lead Qualification
              </CardTitle>
              <CardDescription>
                Use AI to analyze and qualify your captured leads for better conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capturedLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{lead.name}</h4>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                      </div>
                      <Badge className={lead.score >= 80 ? 'bg-green-100 text-green-800' : lead.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        Score: {lead.score}/100
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleQualifyLead(lead.id)}
                      disabled={lead.status === 'qualified'}
                    >
                      {lead.status === 'qualified' ? 'Qualified' : 'Qualify with AI'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{capturedLeads.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Quality</p>
                    <p className="text-2xl font-bold text-gray-900">{capturedLeads.filter(l => l.score >= 80).length}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">12.5%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(capturedLeads.reduce((sum, lead) => sum + lead.score, 0) / capturedLeads.length)}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LeadCapture