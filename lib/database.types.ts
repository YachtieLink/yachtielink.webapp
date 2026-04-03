export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attachment_transfers: {
        Row: {
          attachment_id: string
          cascade_endorsements: boolean
          created_at: string
          from_yacht_id: string
          id: string
          moved_endorsement_ids: string[]
          moved_request_ids: string[]
          reason: string | null
          skipped_endorsement_ids: string[]
          to_yacht_id: string
          transferred_by: string
        }
        Insert: {
          attachment_id: string
          cascade_endorsements?: boolean
          created_at?: string
          from_yacht_id: string
          id?: string
          moved_endorsement_ids?: string[]
          moved_request_ids?: string[]
          reason?: string | null
          skipped_endorsement_ids?: string[]
          to_yacht_id: string
          transferred_by: string
        }
        Update: {
          attachment_id?: string
          cascade_endorsements?: boolean
          created_at?: string
          from_yacht_id?: string
          id?: string
          moved_endorsement_ids?: string[]
          moved_request_ids?: string[]
          reason?: string | null
          skipped_endorsement_ids?: string[]
          to_yacht_id?: string
          transferred_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachment_transfers_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_transfers_from_yacht_id_fkey"
            columns: ["from_yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_transfers_to_yacht_id_fkey"
            columns: ["to_yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachment_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          cruising_area: string | null
          deleted_at: string | null
          description: string | null
          employment_type: string | null
          ended_at: string | null
          id: string
          notes: string | null
          role_id: string | null
          role_label: string
          started_at: string
          updated_at: string
          user_id: string
          yacht_id: string
          yacht_program: string | null
        }
        Insert: {
          created_at?: string
          cruising_area?: string | null
          deleted_at?: string | null
          description?: string | null
          employment_type?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          role_id?: string | null
          role_label: string
          started_at: string
          updated_at?: string
          user_id: string
          yacht_id: string
          yacht_program?: string | null
        }
        Update: {
          created_at?: string
          cruising_area?: string | null
          deleted_at?: string | null
          description?: string | null
          employment_type?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          role_id?: string | null
          role_label?: string
          started_at?: string
          updated_at?: string
          user_id?: string
          yacht_id?: string
          yacht_program?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          page_url: string | null
          status: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          page_url?: string | null
          status?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certification_types: {
        Row: {
          category: string
          created_at: string
          id: string
          issuing_bodies: string[] | null
          keywords: string[] | null
          name: string
          short_name: string | null
          typical_validity_years: number | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          issuing_bodies?: string[] | null
          keywords?: string[] | null
          name: string
          short_name?: string | null
          typical_validity_years?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          issuing_bodies?: string[] | null
          keywords?: string[] | null
          name?: string
          short_name?: string | null
          typical_validity_years?: number | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          certificate_number: string | null
          certification_type_id: string | null
          created_at: string
          custom_cert_name: string | null
          document_url: string | null
          expires_at: string | null
          expiry_reminder_30d_sent: boolean | null
          expiry_reminder_60d_sent: boolean | null
          id: string
          issued_at: string | null
          issuing_body: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_number?: string | null
          certification_type_id?: string | null
          created_at?: string
          custom_cert_name?: string | null
          document_url?: string | null
          expires_at?: string | null
          expiry_reminder_30d_sent?: boolean | null
          expiry_reminder_60d_sent?: boolean | null
          id?: string
          issued_at?: string | null
          issuing_body?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_number?: string | null
          certification_type_id?: string | null
          created_at?: string
          custom_cert_name?: string | null
          document_url?: string | null
          expires_at?: string | null
          expiry_reminder_30d_sent?: boolean | null
          expiry_reminder_60d_sent?: boolean | null
          id?: string
          issued_at?: string | null
          issuing_body?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications_registry: {
        Row: {
          abbreviation: string | null
          aliases: string[] | null
          category: string
          created_at: string | null
          crew_count: number | null
          description: string | null
          equivalence_note: string | null
          id: string
          issuing_authority: string
          name: string
          review_status: string | null
          source: string | null
          typical_validity_years: number | null
          updated_at: string | null
        }
        Insert: {
          abbreviation?: string | null
          aliases?: string[] | null
          category: string
          created_at?: string | null
          crew_count?: number | null
          description?: string | null
          equivalence_note?: string | null
          id?: string
          issuing_authority: string
          name: string
          review_status?: string | null
          source?: string | null
          typical_validity_years?: number | null
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string | null
          aliases?: string[] | null
          category?: string
          created_at?: string | null
          crew_count?: number | null
          description?: string | null
          equivalence_note?: string | null
          id?: string
          issuing_authority?: string
          name?: string
          review_status?: string | null
          source?: string | null
          typical_validity_years?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      endorsement_requests: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          is_shareable: boolean
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_user_id: string | null
          reminded_at: string | null
          requester_id: string
          sent_via: string | null
          status: string
          suggested_endorsements: Json | null
          token: string
          yacht_id: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_shareable?: boolean
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          reminded_at?: string | null
          requester_id: string
          sent_via?: string | null
          status?: string
          suggested_endorsements?: Json | null
          token?: string
          yacht_id: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_shareable?: boolean
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string | null
          reminded_at?: string | null
          requester_id?: string
          sent_via?: string | null
          status?: string
          suggested_endorsements?: Json | null
          token?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endorsement_requests_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsement_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsement_requests_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      endorsements: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          endorser_id: string | null
          endorser_role_label: string | null
          ghost_endorser_id: string | null
          id: string
          is_dormant: boolean | null
          is_pinned: boolean
          recipient_id: string
          recipient_role_label: string | null
          updated_at: string
          worked_together_end: string | null
          worked_together_start: string | null
          yacht_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          endorser_id?: string | null
          endorser_role_label?: string | null
          ghost_endorser_id?: string | null
          id?: string
          is_dormant?: boolean | null
          is_pinned?: boolean
          recipient_id: string
          recipient_role_label?: string | null
          updated_at?: string
          worked_together_end?: string | null
          worked_together_start?: string | null
          yacht_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          endorser_id?: string | null
          endorser_role_label?: string | null
          ghost_endorser_id?: string | null
          id?: string
          is_dormant?: boolean | null
          is_pinned?: boolean
          recipient_id?: string
          recipient_role_label?: string | null
          updated_at?: string
          worked_together_end?: string | null
          worked_together_start?: string | null
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endorsements_endorser_id_fkey"
            columns: ["endorser_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsements_ghost_endorser_id_fkey"
            columns: ["ghost_endorser_id"]
            isOneToOne: false
            referencedRelation: "ghost_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsements_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsements_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_transfers: {
        Row: {
          employment_id: string
          from_yacht_id: string
          id: string
          to_yacht_id: string
          transferred_at: string | null
          user_id: string
        }
        Insert: {
          employment_id: string
          from_yacht_id: string
          id?: string
          to_yacht_id: string
          transferred_at?: string | null
          user_id: string
        }
        Update: {
          employment_id?: string
          from_yacht_id?: string
          id?: string
          to_yacht_id?: string
          transferred_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_transfers_from_yacht_id_fkey"
            columns: ["from_yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_transfers_to_yacht_id_fkey"
            columns: ["to_yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      ghost_profiles: {
        Row: {
          account_status: string
          claimed_by: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          primary_role: string | null
          verified_via: string | null
        }
        Insert: {
          account_status?: string
          claimed_by?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          primary_role?: string | null
          verified_via?: string | null
        }
        Update: {
          account_status?: string
          claimed_by?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          primary_role?: string | null
          verified_via?: string | null
        }
        Relationships: []
      }
      land_experience: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          industry: string | null
          role: string
          sort_order: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          industry?: string | null
          role?: string
          sort_order?: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          industry?: string | null
          role?: string
          sort_order?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      other_cert_entries: {
        Row: {
          category: string | null
          created_at: string
          id: string
          submitted_by: string | null
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          submitted_by?: string | null
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          submitted_by?: string | null
          value?: string
        }
        Relationships: []
      }
      other_role_entries: {
        Row: {
          created_at: string
          department: string | null
          id: string
          submitted_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          submitted_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          submitted_by?: string | null
          value?: string
        }
        Relationships: []
      }
      profile_analytics: {
        Row: {
          event_type: string
          id: string
          occurred_at: string
          user_id: string
          viewer_location: string | null
          viewer_role: string | null
        }
        Insert: {
          event_type: string
          id?: string
          occurred_at?: string
          user_id: string
          viewer_location?: string | null
          viewer_role?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          occurred_at?: string
          user_id?: string
          viewer_location?: string | null
          viewer_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_folders: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category: string
          created_at: string | null
          duplicate_of_yacht_id: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          duplicate_of_yacht_id?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          duplicate_of_yacht_id?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_duplicate_of_yacht_id_fkey"
            columns: ["duplicate_of_yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          department: string
          id: string
          is_senior: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          is_senior?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          is_senior?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      saved_profiles: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          notes: string | null
          saved_user_id: string
          user_id: string
          watching: boolean | null
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          notes?: string | null
          saved_user_id: string
          user_id: string
          watching?: boolean | null
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          notes?: string | null
          saved_user_id?: string
          user_id?: string
          watching?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_profiles_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "profile_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_profiles_saved_user_id_fkey"
            columns: ["saved_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_free: boolean
          name: string
          preview_url: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          name: string
          preview_url?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          name?: string
          preview_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      user_education: {
        Row: {
          created_at: string
          ended_at: string | null
          field_of_study: string | null
          id: string
          institution: string
          qualification: string | null
          sort_order: number
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          field_of_study?: string | null
          id?: string
          institution: string
          qualification?: string | null
          sort_order?: number
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string
          qualification?: string | null
          sort_order?: number
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number
          user_id: string
          yacht_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          user_id: string
          yacht_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          user_id?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_gallery_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gallery_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hobbies: {
        Row: {
          emoji: string | null
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hobbies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_photos: {
        Row: {
          created_at: string
          focal_x: number
          focal_y: number
          id: string
          is_avatar: boolean
          is_cv: boolean
          is_hero: boolean
          photo_url: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          is_avatar?: boolean
          is_cv?: boolean
          is_hero?: boolean
          photo_url: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          is_avatar?: boolean
          is_cv?: boolean
          is_hero?: boolean
          photo_url?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          category: string | null
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          accent_color: string
          ai_summary: string | null
          ai_summary_edited: boolean
          analytics_nudge_sent: boolean | null
          appearance_note: string | null
          available_for_work: boolean
          available_from: string | null
          available_notes: string | null
          bio: string | null
          contact_email: string | null
          created_at: string
          custom_subdomain: string | null
          cv_parse_count_reset_at: string | null
          cv_parse_count_today: number | null
          cv_parsed_at: string | null
          cv_public: boolean | null
          cv_public_source: string | null
          cv_storage_path: string | null
          deleted_at: string | null
          departments: string[] | null
          display_name: string | null
          dob: string | null
          email: string
          founding_member: boolean | null
          full_name: string
          handle: string | null
          home_country: string | null
          id: string
          interests_summary: string | null
          languages: Json | null
          last_seen_at: string | null
          latest_pdf_generated_at: string | null
          latest_pdf_path: string | null
          license_info: string | null
          location_city: string | null
          location_country: string | null
          onboarding_complete: boolean
          phone: string | null
          primary_role: string | null
          profile_photo_url: string | null
          profile_template: string
          profile_view_mode: string
          scrim_preset: string
          section_visibility: Json
          show_dob: boolean
          show_email: boolean
          show_home_country: boolean
          show_location: boolean
          show_nationality_flag: boolean
          show_phone: boolean
          show_watermark: boolean
          show_whatsapp: boolean
          skills_summary: string | null
          smoke_pref: string | null
          social_links: Json
          stripe_customer_id: string | null
          subdomain_suspended: boolean
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_status: string
          template_id: string | null
          travel_docs: string[] | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string
          ai_summary?: string | null
          ai_summary_edited?: boolean
          analytics_nudge_sent?: boolean | null
          appearance_note?: string | null
          available_for_work?: boolean
          available_from?: string | null
          available_notes?: string | null
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          custom_subdomain?: string | null
          cv_parse_count_reset_at?: string | null
          cv_parse_count_today?: number | null
          cv_parsed_at?: string | null
          cv_public?: boolean | null
          cv_public_source?: string | null
          cv_storage_path?: string | null
          deleted_at?: string | null
          departments?: string[] | null
          display_name?: string | null
          dob?: string | null
          email: string
          founding_member?: boolean | null
          full_name: string
          handle?: string | null
          home_country?: string | null
          id: string
          interests_summary?: string | null
          languages?: Json | null
          last_seen_at?: string | null
          latest_pdf_generated_at?: string | null
          latest_pdf_path?: string | null
          license_info?: string | null
          location_city?: string | null
          location_country?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          profile_template?: string
          profile_view_mode?: string
          scrim_preset?: string
          section_visibility?: Json
          show_dob?: boolean
          show_email?: boolean
          show_home_country?: boolean
          show_location?: boolean
          show_nationality_flag?: boolean
          show_phone?: boolean
          show_watermark?: boolean
          show_whatsapp?: boolean
          skills_summary?: string | null
          smoke_pref?: string | null
          social_links?: Json
          stripe_customer_id?: string | null
          subdomain_suspended?: boolean
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string
          template_id?: string | null
          travel_docs?: string[] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string
          ai_summary?: string | null
          ai_summary_edited?: boolean
          analytics_nudge_sent?: boolean | null
          appearance_note?: string | null
          available_for_work?: boolean
          available_from?: string | null
          available_notes?: string | null
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          custom_subdomain?: string | null
          cv_parse_count_reset_at?: string | null
          cv_parse_count_today?: number | null
          cv_parsed_at?: string | null
          cv_public?: boolean | null
          cv_public_source?: string | null
          cv_storage_path?: string | null
          deleted_at?: string | null
          departments?: string[] | null
          display_name?: string | null
          dob?: string | null
          email?: string
          founding_member?: boolean | null
          full_name?: string
          handle?: string | null
          home_country?: string | null
          id?: string
          interests_summary?: string | null
          languages?: Json | null
          last_seen_at?: string | null
          latest_pdf_generated_at?: string | null
          latest_pdf_path?: string | null
          license_info?: string | null
          location_city?: string | null
          location_country?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          profile_template?: string
          profile_view_mode?: string
          scrim_preset?: string
          section_visibility?: Json
          show_dob?: boolean
          show_email?: boolean
          show_home_country?: boolean
          show_location?: boolean
          show_nationality_flag?: boolean
          show_phone?: boolean
          show_watermark?: boolean
          show_whatsapp?: boolean
          skills_summary?: string | null
          smoke_pref?: string | null
          social_links?: Json
          stripe_customer_id?: string | null
          subdomain_suspended?: boolean
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string
          template_id?: string | null
          travel_docs?: string[] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_builders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          name_normalized: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          name_normalized: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          name_normalized?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_builders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_names: {
        Row: {
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          name: string
          name_normalized: string
          started_at: string | null
          yacht_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          name: string
          name_normalized?: string
          started_at?: string | null
          yacht_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          name?: string
          name_normalized?: string
          started_at?: string | null
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_names_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yacht_names_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_near_miss_log: {
        Row: {
          action: string
          candidate_ids: string[]
          chosen_id: string | null
          created_at: string
          created_by: string | null
          id: string
          search_term: string
        }
        Insert: {
          action: string
          candidate_ids?: string[]
          chosen_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          search_term: string
        }
        Update: {
          action?: string
          candidate_ids?: string[]
          chosen_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          search_term?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_near_miss_log_chosen_id_fkey"
            columns: ["chosen_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yacht_near_miss_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          builder_id: string | null
          cover_photo_url: string | null
          created_at: string
          created_by: string | null
          established_at: string | null
          flag_state: string | null
          id: string
          is_established: boolean
          length_meters: number | null
          name: string
          name_normalized: string | null
          size_category: string
          yacht_type: string | null
          year_built: number | null
        }
        Insert: {
          builder_id?: string | null
          cover_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          established_at?: string | null
          flag_state?: string | null
          id?: string
          is_established?: boolean
          length_meters?: number | null
          name: string
          name_normalized?: string | null
          size_category?: string
          yacht_type?: string | null
          year_built?: number | null
        }
        Update: {
          builder_id?: string | null
          cover_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          established_at?: string | null
          flag_state?: string | null
          id?: string
          is_established?: boolean
          length_meters?: number | null
          name?: string
          name_normalized?: string | null
          size_category?: string
          yacht_type?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "yachts_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "yacht_builders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yachts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_coworkers: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      are_coworkers_on_yacht: {
        Args: { user_a: string; user_b: string; yacht: string }
        Returns: boolean
      }
      check_cv_parse_limit: { Args: { p_user_id: string }; Returns: boolean }
      check_yacht_established: { Args: { yacht_id: string }; Returns: boolean }
      claim_ghost_profile: { Args: never; Returns: Json }
      endorsement_requests_today: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_analytics_summary: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          event_count: number
          event_type: string
          latest_at: string
        }[]
      }
      get_analytics_timeseries: {
        Args: { p_days?: number; p_event_type: string; p_user_id: string }
        Returns: {
          day: string
          event_count: number
        }[]
      }
      get_colleagues: {
        Args: { p_user_id: string }
        Returns: {
          colleague_id: string
          shared_yachts: string[]
        }[]
      }
      get_endorsement_request_by_token: {
        Args: { p_token: string }
        Returns: Json
      }
      get_endorsement_request_limit: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_ghost_profile_summary: { Args: { p_id: string }; Returns: Json }
      get_mutual_colleagues: {
        Args: { p_profile_id: string; p_viewer_id: string }
        Returns: {
          mutual_colleague_id: string
        }[]
      }
      get_sea_time: {
        Args: { p_user_id: string }
        Returns: {
          total_days: number
          yacht_count: number
        }[]
      }
      get_sea_time_detailed: {
        Args: { p_user_id: string }
        Returns: {
          days: number
          ended_at: string
          is_current: boolean
          role_label: string
          started_at: string
          yacht_id: string
          yacht_name: string
        }[]
      }
      get_weekly_view_counts: {
        Args: never
        Returns: {
          user_id: string
          view_count: number
        }[]
      }
      get_yacht_avg_tenure_days: {
        Args: { p_yacht_id: string }
        Returns: number
      }
      get_yacht_crew_threshold: {
        Args: { size_category: string }
        Returns: number
      }
      get_yacht_endorsement_count: {
        Args: { p_yacht_id: string }
        Returns: number
      }
      handle_available: { Args: { p_handle: string }; Returns: boolean }
      record_profile_event: {
        Args: {
          p_event_type: string
          p_user_id: string
          p_viewer_location?: string
          p_viewer_role?: string
        }
        Returns: undefined
      }
      search_builders: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          id: string
          name: string
          sim: number
        }[]
      }
      search_certifications: {
        Args: { lim?: number; query: string }
        Returns: {
          abbreviation: string
          category: string
          crew_count: number
          equivalence_note: string
          id: string
          issuing_authority: string
          name: string
          similarity: number
          typical_validity_years: number
        }[]
      }
      search_yachts: {
        Args: {
          p_builder?: string
          p_length_max?: number
          p_length_min?: number
          p_limit?: number
          p_query: string
        }
        Returns: {
          builder: string
          cover_photo_url: string
          crew_count: number
          current_crew_count: number
          flag_state: string
          id: string
          length_meters: number
          name: string
          sim: number
          yacht_type: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      strip_yacht_prefix: { Args: { raw: string }; Returns: string }
      submit_report: {
        Args: {
          p_category: string
          p_details?: string
          p_reason: string
          p_target_id: string
          p_target_type: string
        }
        Returns: Json
      }
      suggest_handles: {
        Args: { p_birth_year?: number; p_full_name: string }
        Returns: string[]
      }
      transfer_attachment: {
        Args: {
          p_attachment_id: string
          p_cascade_endorsements?: boolean
          p_reason?: string
          p_to_yacht_id: string
        }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_section_visibility: {
        Args: { p_section: string; p_user_id: string; p_visible: boolean }
        Returns: undefined
      }
      yacht_crew_count: { Args: { yacht: string }; Returns: number }
      yacht_prefix_type: { Args: { raw: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
