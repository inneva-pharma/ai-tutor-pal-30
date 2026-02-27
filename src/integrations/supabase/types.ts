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
      challenge_questions: {
        Row: {
          answer1: string
          answer2: string
          answer3: string
          answer4: string
          challenge_id: number
          correctAnswer: number
          explanation: string | null
          id: number
          isInvalidQuestion: boolean
          question: string
        }
        Insert: {
          answer1: string
          answer2: string
          answer3: string
          answer4: string
          challenge_id: number
          correctAnswer: number
          explanation?: string | null
          id?: number
          isInvalidQuestion?: boolean
          question: string
        }
        Update: {
          answer1?: string
          answer2?: string
          answer3?: string
          answer4?: string
          challenge_id?: number
          correctAnswer?: number
          explanation?: string | null
          id?: number
          isInvalidQuestion?: boolean
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_questions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_result_details: {
        Row: {
          challengeResult_id: number
          id: number
          isCorrect: boolean | null
          question_id: number
          selectedAnswer: number
        }
        Insert: {
          challengeResult_id: number
          id?: number
          isCorrect?: boolean | null
          question_id: number
          selectedAnswer: number
        }
        Update: {
          challengeResult_id?: number
          id?: number
          isCorrect?: boolean | null
          question_id?: number
          selectedAnswer?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_result_details_challengeResult_id_fkey"
            columns: ["challengeResult_id"]
            isOneToOne: false
            referencedRelation: "challenge_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_result_details_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "challenge_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_results: {
        Row: {
          answersLists: string
          challenge_id: number
          correctAnswers: number
          createDate: string
          id: number
          isCompleted: boolean | null
          isReviewed: boolean
          score: number
          totalQuestions: number
          user_id: string
        }
        Insert: {
          answersLists?: string
          challenge_id: number
          correctAnswers: number
          createDate?: string
          id?: number
          isCompleted?: boolean | null
          isReviewed?: boolean
          score: number
          totalQuestions: number
          user_id: string
        }
        Update: {
          answersLists?: string
          challenge_id?: number
          correctAnswers?: number
          createDate?: string
          id?: number
          isCompleted?: boolean | null
          isReviewed?: boolean
          score?: number
          totalQuestions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          accessPermissions: number
          createDate: string
          difficulty: string
          grade_id: number
          id: number
          isDeleted: boolean
          isValidated: number
          language: string
          lastModificationDate: string
          lastUseDate: string
          name: string
          questionCount: number
          subject_id: number
          topic: string | null
          user_id: string
        }
        Insert: {
          accessPermissions?: number
          createDate?: string
          difficulty?: string
          grade_id: number
          id?: number
          isDeleted?: boolean
          isValidated?: number
          language?: string
          lastModificationDate?: string
          lastUseDate?: string
          name: string
          questionCount?: number
          subject_id: number
          topic?: string | null
          user_id: string
        }
        Update: {
          accessPermissions?: number
          createDate?: string
          difficulty?: string
          grade_id?: number
          id?: number
          isDeleted?: boolean
          isValidated?: number
          language?: string
          lastModificationDate?: string
          lastUseDate?: string
          name?: string
          questionCount?: number
          subject_id?: number
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          chatBot_id: string
          createDate: string
          id: number
          lastUseDate: string
          redis_id: string
          users_id: string
        }
        Insert: {
          chatBot_id: string
          createDate?: string
          id?: number
          lastUseDate?: string
          redis_id?: string
          users_id: string
        }
        Update: {
          chatBot_id?: string
          createDate?: string
          id?: number
          lastUseDate?: string
          redis_id?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_sessions_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          accessPermissions: number
          chatBotType: number
          createDate: string
          grade: string
          id: number
          isDeleted: boolean
          language: string
          lastUseDate: string
          learningStyle: string | null
          name: string
          personality: string | null
          prompt: string
          sessionId: string
          subject: string
          user_id: string
        }
        Insert: {
          accessPermissions?: number
          chatBotType?: number
          createDate?: string
          grade: string
          id?: number
          isDeleted?: boolean
          language?: string
          lastUseDate?: string
          learningStyle?: string | null
          name: string
          personality?: string | null
          prompt?: string
          sessionId?: string
          subject: string
          user_id: string
        }
        Update: {
          accessPermissions?: number
          chatBotType?: number
          createDate?: string
          grade?: string
          id?: number
          isDeleted?: boolean
          language?: string
          lastUseDate?: string
          learningStyle?: string | null
          name?: string
          personality?: string | null
          prompt?: string
          sessionId?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration: {
        Row: {
          allowAppAccess: number
          allowUserRememberAccess: number
          currentDatabaseVersion: number
          expireTokenTime: number
          expireTokenUseTime: number
          id: number
          lastSupportedAppVersion: number
          loginWithDoubleAuthen: number
        }
        Insert: {
          allowAppAccess?: number
          allowUserRememberAccess?: number
          currentDatabaseVersion?: number
          expireTokenTime?: number
          expireTokenUseTime?: number
          id?: number
          lastSupportedAppVersion?: number
          loginWithDoubleAuthen?: number
        }
        Update: {
          allowAppAccess?: number
          allowUserRememberAccess?: number
          currentDatabaseVersion?: number
          expireTokenTime?: number
          expireTokenUseTime?: number
          id?: number
          lastSupportedAppVersion?: number
          loginWithDoubleAuthen?: number
        }
        Relationships: []
      }
      curriculum_summaries: {
        Row: {
          content: string | null
          createdAt: string | null
          cycle: string | null
          grade_id: number | null
          id: number
          stage: string | null
          subject_id: string | null
          updatedAt: string | null
        }
        Insert: {
          content?: string | null
          createdAt?: string | null
          cycle?: string | null
          grade_id?: number | null
          id?: number
          stage?: string | null
          subject_id?: string | null
          updatedAt?: string | null
        }
        Update: {
          content?: string | null
          createdAt?: string | null
          cycle?: string | null
          grade_id?: number | null
          id?: number
          stage?: string | null
          subject_id?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          chatbot_id: number
          chatbot_sessionId: string
          description: string
          id: number
          name: string
          url: string
          users_id: string
        }
        Insert: {
          chatbot_id: number
          chatbot_sessionId: string
          description?: string
          id?: number
          name: string
          url?: string
          users_id: string
        }
        Update: {
          chatbot_id?: number
          chatbot_sessionId?: string
          description?: string
          id?: number
          name?: string
          url?: string
          users_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          email: string
          id: string
          lastname: string | null
          name: string | null
          nick: string | null
          schools_id: number | null
        }
        Insert: {
          email: string
          id: string
          lastname?: string | null
          name?: string | null
          nick?: string | null
          schools_id?: number | null
        }
        Update: {
          email?: string
          id?: string
          lastname?: string | null
          name?: string | null
          nick?: string | null
          schools_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_schools_id_fkey"
            columns: ["schools_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      registers: {
        Row: {
          createDate: string
          id: number
          info1: string | null
          info2: string | null
          ip: string
          sqlQuestionName: string
          token: string | null
          users_id: string | null
        }
        Insert: {
          createDate?: string
          id?: number
          info1?: string | null
          info2?: string | null
          ip?: string
          sqlQuestionName?: string
          token?: string | null
          users_id?: string | null
        }
        Update: {
          createDate?: string
          id?: number
          info1?: string | null
          info2?: string | null
          ip?: string
          sqlQuestionName?: string
          token?: string | null
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registers_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          contactEmail: string | null
          id: number
          maxStudents: number | null
          maxTeachers: number | null
          name: string
          tlf: string | null
          web: string | null
        }
        Insert: {
          address?: string | null
          contactEmail?: string | null
          id?: number
          maxStudents?: number | null
          maxTeachers?: number | null
          name: string
          tlf?: string | null
          web?: string | null
        }
        Update: {
          address?: string | null
          contactEmail?: string | null
          id?: number
          maxStudents?: number | null
          maxTeachers?: number | null
          name?: string
          tlf?: string | null
          web?: string | null
        }
        Relationships: []
      }
      schools_have_grades: {
        Row: {
          grade_id: number
          id: number
          school_id: number
        }
        Insert: {
          grade_id: number
          id?: number
          school_id: number
        }
        Update: {
          grade_id?: number
          id?: number
          school_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "schools_have_grades_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_have_grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools_have_subjects: {
        Row: {
          id: number
          school_id: number
          subject_id: number
        }
        Insert: {
          id?: number
          school_id: number
          subject_id: number
        }
        Update: {
          id?: number
          school_id?: number
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "schools_have_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_have_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      share_content: {
        Row: {
          challenge_id: number | null
          chatBot_id: number | null
          classroomLetter: string | null
          createDate: string
          id: number
          lastModificationDate: string
          shareContentType: number
          user_id: string
        }
        Insert: {
          challenge_id?: number | null
          chatBot_id?: number | null
          classroomLetter?: string | null
          createDate?: string
          id?: number
          lastModificationDate?: string
          shareContentType: number
          user_id: string
        }
        Update: {
          challenge_id?: number | null
          chatBot_id?: number | null
          classroomLetter?: string | null
          createDate?: string
          id?: number
          lastModificationDate?: string
          shareContentType?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_content_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_content_chatBot_id_fkey"
            columns: ["chatBot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          allowShareContent: boolean
          classroomLetter: string
          id: string
          needTeacherPermissionToShare: boolean
        }
        Insert: {
          allowShareContent?: boolean
          classroomLetter?: string
          id: string
          needTeacherPermissionToShare?: boolean
        }
        Update: {
          allowShareContent?: boolean
          classroomLetter?: string
          id?: string
          needTeacherPermissionToShare?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students_enrollments: {
        Row: {
          classroomLetter: string
          grade_id: number
          id: number
          subject_id: number
          user_id: string
        }
        Insert: {
          classroomLetter: string
          grade_id: number
          id?: number
          subject_id: number
          user_id: string
        }
        Update: {
          classroomLetter?: string
          grade_id?: number
          id?: number
          subject_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_enrollments_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_enrollments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trackings: {
        Row: {
          databaseCreateDate: string
          deviceId: string
          duration: number
          id: number
          info1: string
          info2: string | null
          info3: string | null
          info4: string | null
          info5: string | null
          userCreateDate: string
          users_id: string | null
        }
        Insert: {
          databaseCreateDate?: string
          deviceId?: string
          duration?: number
          id?: number
          info1?: string
          info2?: string | null
          info3?: string | null
          info4?: string | null
          info5?: string | null
          userCreateDate: string
          users_id?: string | null
        }
        Update: {
          databaseCreateDate?: string
          deviceId?: string
          duration?: number
          id?: number
          info1?: string
          info2?: string | null
          info3?: string | null
          info4?: string | null
          info5?: string | null
          userCreateDate?: string
          users_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trackings_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role_id: number
          user_id: string
        }
        Insert: {
          id?: string
          role_id?: number
          user_id: string
        }
        Update: {
          id?: string
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role_id: { Args: { _user_id: string }; Returns: number }
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
