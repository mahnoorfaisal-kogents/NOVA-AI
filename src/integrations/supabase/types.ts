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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string | null
          error: string | null
          goal: string
          id: string
          plan: Json | null
          project_id: string | null
          result: string | null
          status: string
          steps: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          goal: string
          id?: string
          plan?: Json | null
          project_id?: string | null
          result?: string | null
          status?: string
          steps?: Json | null
          user_id?: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          goal?: string
          id?: string
          plan?: Json | null
          project_id?: string | null
          result?: string | null
          status?: string
          steps?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string | null
          id: string
          instructions: string | null
          model: string | null
          name: string
          permissions: string
          project_id: string | null
          tools: string[] | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          model?: string | null
          name: string
          permissions?: string
          project_id?: string | null
          tools?: string[] | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          model?: string | null
          name?: string
          permissions?: string
          project_id?: string | null
          tools?: string[] | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          action: string
          agent_id: string | null
          agent_run_id: string | null
          created_at: string | null
          data_involved: string | null
          description: string
          id: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          action: string
          agent_id?: string | null
          agent_run_id?: string | null
          created_at?: string | null
          data_involved?: string | null
          description: string
          id?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          agent_run_id?: string | null
          created_at?: string | null
          data_involved?: string | null
          description?: string
          id?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: string
          agent_id: string | null
          approval_id: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          permission: string | null
          result: string
          tool: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor: string
          agent_id?: string | null
          approval_id?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          permission?: string | null
          result: string
          tool?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          actor?: string
          agent_id?: string | null
          approval_id?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          permission?: string | null
          result?: string
          tool?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          automation_id: string
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          result: string | null
          status: string
          user_id: string
        }
        Insert: {
          automation_id: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          result?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          automation_id?: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          result?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_config: Json | null
          action_type: string
          conditions: Json | null
          created_at: string | null
          enabled: boolean
          id: string
          name: string
          project_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          conditions?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          name: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          conditions?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          name?: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          key_points: string[] | null
          message_range_end: number
          message_range_start: number
          summary: string
          topics: string[] | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          message_range_end: number
          message_range_start: number
          summary: string
          topics?: string[] | null
          user_id?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          message_range_end?: number
          message_range_start?: number
          summary?: string
          topics?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived: boolean
          created_at: string | null
          folder_id: string | null
          id: string
          model: string | null
          pinned: boolean
          project_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string | null
          folder_id?: string | null
          id?: string
          model?: string | null
          pinned?: boolean
          project_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string | null
          folder_id?: string | null
          id?: string
          model?: string | null
          pinned?: boolean
          project_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          change_description: string | null
          content_text: string | null
          created_at: string | null
          file_id: string
          id: string
          storage_path: string | null
          user_id: string
          version: number
        }
        Insert: {
          change_description?: string | null
          content_text?: string | null
          created_at?: string | null
          file_id: string
          id?: string
          storage_path?: string | null
          user_id?: string
          version: number
        }
        Update: {
          change_description?: string | null
          content_text?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
          storage_path?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_entities: {
        Row: {
          created_at: string | null
          description: string | null
          entity_type: string
          id: string
          metadata: Json | null
          name: string
          relationships: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          name: string
          relationships?: Json | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          relationships?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          archived: boolean
          category: string
          confidence: number
          content: string
          created_at: string | null
          id: string
          importance: number
          last_accessed: string | null
          project_id: string | null
          source: string
          updated_at: string | null
          user_confirmed: boolean
          user_id: string
        }
        Insert: {
          archived?: boolean
          category?: string
          confidence?: number
          content: string
          created_at?: string | null
          id?: string
          importance?: number
          last_accessed?: string | null
          project_id?: string | null
          source?: string
          updated_at?: string | null
          user_confirmed?: boolean
          user_id?: string
        }
        Update: {
          archived?: boolean
          category?: string
          confidence?: number
          content?: string
          created_at?: string | null
          id?: string
          importance?: number
          last_accessed?: string | null
          project_id?: string | null
          source?: string
          updated_at?: string | null
          user_confirmed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          branch_id: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          model: string | null
          parent_message_id: string | null
          provider: string | null
          role: string
          status: string
          tokens: number | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          content?: string
          conversation_id: string
          created_at?: string | null
          id?: string
          model?: string | null
          parent_message_id?: string | null
          provider?: string | null
          role: string
          status?: string
          tokens?: number | null
          user_id?: string
        }
        Update: {
          branch_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          model?: string | null
          parent_message_id?: string | null
          provider?: string | null
          role?: string
          status?: string
          tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          category: string
          created_at: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          plan: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          plan?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          plan?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          content_text: string | null
          created_at: string | null
          deleted: boolean
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          name: string
          project_id: string | null
          storage_path: string | null
          summary: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          content_text?: string | null
          created_at?: string | null
          deleted?: boolean
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          name: string
          project_id?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          version?: number
        }
        Update: {
          content_text?: string | null
          created_at?: string | null
          deleted?: boolean
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          ai_created: boolean
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: string
          project_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_created?: boolean
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          ai_created?: boolean
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_entries: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          semantic_tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          semantic_tags?: string[] | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          semantic_tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          id: string
          model: string | null
          provider: string | null
          resource_type: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          resource_type: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          provider?: string | null
          resource_type?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
