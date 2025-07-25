import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { MapPin, DollarSign, Home, Users, Brain, Sparkles, Phone, Mail, Calendar, TrendingUp } from 'lucide-react'
import { blink } from '@/blink/client'

interface GeneratedLead {
  id: string
  name: string
  email: string
  phone: string
  propertyType: string
  location: string
  priceRange: string
  timeline: string
  motivation: string
  score: number
  aiInsights: string
  contactPreference: string
  leadType: 'seller' | 'buyer'
  estimatedValue: string
  probability: number
}

export default function LeadGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLeads, setGeneratedLeads] = useState<GeneratedLead[]>([])
  const [formData, setFormData] = useState({
    location: '',
    propertyType: '',
    priceRange: '',
    leadType: '',
    targetCriteria: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateLeads = async () => {
    setIsGenerating(true)
    
    try {
      // Use AI to generate realistic leads based on criteria
      const prompt = `Generate 3-5 realistic real estate leads based on these criteria:
      - Location: ${formData.location}
      - Property Type: ${formData.propertyType}
      - Price Range: ${formData.priceRange}
      - Lead Type: ${formData.leadType}
      - Additional Criteria: ${formData.targetCriteria}
      
      For each lead, provide:
      - Full name (realistic)
      - Email and phone
      - Specific motivation for buying/selling
      - Timeline urgency
      - Lead quality score (0-100)
      - AI insights about their needs
      - Estimated property value
      - Probability of conversion (0-100)
      
      Make the leads diverse and realistic for the ${formData.location} market.`

      const { object } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  propertyType: { type: 'string' },
                  location: { type: 'string' },
                  priceRange: { type: 'string' },
                  timeline: { type: 'string' },
                  motivation: { type: 'string' },
                  score: { type: 'number' },
                  aiInsights: { type: 'string' },
                  contactPreference: { type: 'string' },
                  leadType: { type: 'string' },
                  estimatedValue: { type: 'string' },
                  probability: { type: 'number' }
                }
              }
            }
          }
        }
      })

      const leads = object.leads.map((lead: any, index: number) => ({
        ...lead,
        id: `lead_${Date.now()}_${index}`
      }))

      setGeneratedLeads(leads)
    } catch (error) {
      console.error('Error generating leads:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Brain className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Lead Generator</h1>
          <p className="text-gray-600">Use AI to discover and qualify potential real estate leads</p>
        </div>
      </div>

      {/* Lead Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Generate New Leads
          </CardTitle>
          <CardDescription>
            Specify your target criteria and let AI find qualified leads for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Target Location</Label>
              <Input
                id="location"
                placeholder="e.g., Miami, FL or Downtown Seattle"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-family">Single Family Home</SelectItem>
                  <SelectItem value="condo">Condominium</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi-family">Multi-Family</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land/Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <Select value={formData.priceRange} onValueChange={(value) => handleInputChange('priceRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-200k">Under $200K</SelectItem>
                  <SelectItem value="200k-400k">$200K - $400K</SelectItem>
                  <SelectItem value="400k-600k">$400K - $600K</SelectItem>
                  <SelectItem value="600k-800k">$600K - $800K</SelectItem>
                  <SelectItem value="800k-1m">$800K - $1M</SelectItem>
                  <SelectItem value="over-1m">Over $1M</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadType">Lead Type</Label>
              <Select value={formData.leadType} onValueChange={(value) => handleInputChange('leadType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyers</SelectItem>
                  <SelectItem value="seller">Sellers</SelectItem>
                  <SelectItem value="both">Both Buyers & Sellers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCriteria">Additional Target Criteria</Label>
            <Textarea
              id="targetCriteria"
              placeholder="e.g., First-time homebuyers, investors looking for rental properties, families relocating for work..."
              value={formData.targetCriteria}
              onChange={(e) => handleInputChange('targetCriteria', e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={generateLeads} 
            disabled={isGenerating || !formData.location || !formData.leadType}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Generating Leads...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Leads
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Leads */}
      {generatedLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Generated Leads</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {generatedLeads.length} leads found
            </Badge>
          </div>

          <div className="grid gap-4">
            {generatedLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{lead.leadType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getScoreBadge(lead.score)}>
                        Score: {lead.score}/100
                      </Badge>
                      <div className="mt-1">
                        <Progress value={lead.probability} className="w-20 h-2" />
                        <p className="text-xs text-gray-500 mt-1">{lead.probability}% likely</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{lead.location}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span>{lead.propertyType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{lead.estimatedValue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{lead.timeline}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Motivation</h4>
                      <p className="text-sm text-gray-600">{lead.motivation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        AI Insights
                      </h4>
                      <p className="text-sm text-gray-600">{lead.aiInsights}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                    <Button size="sm" variant="outline">
                      Save Lead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {generatedLeads.length === 0 && !isGenerating && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <Brain className="h-8 w-8 text-gray-400 mx-auto mt-2" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Leads</h3>
            <p className="text-gray-600 mb-4">
              Fill out the criteria above and let AI find qualified leads for your real estate business
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                AI-Powered
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Quality Scored
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Ready to Contact
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}