import React, { createContext, useContext, useState, ReactNode } from "react";

interface BattingOrderPlayer {
  playerName: string;
  playerId: string;
  battingOrder: number;
  profileImage?: string;
}

interface Benchmark {
  category: string;
  criteria: string[];
  icon: string;
  description?: string;
}

interface TeamRule {
  title: string;
  description: string;
  icon: string;
  category?: string;
}

interface TeamConfig {
  COUNTERSTRIKERS_TEAM_ID: number;
  ADMIN_PROFILE_ID: number;
  AWARD_NOW_VISIBLITY_PROFILE_ID: number[];
  battingOrder: BattingOrderPlayer[];
  teamMembers: BattingOrderPlayer[];
  benchmarks: Benchmark[];
  teamRules: TeamRule[];
  metadata: {
    lastUpdated: string;
    evaluationFrequency: string;
    teamName: string;
    version: string;
    decisionAuthority: string[];
    minimumBenchmarkNotes: string;
  };
  additionalInfo: {
    importantNote: {
      title: string;
      message: string;
      icon: string;
    };
    evaluationCriteria: {
      batting: {
        topOrder: {
          minimumAverage: number;
          minimumStrikeRate: number;
        };
      };
      bowling: {
        fullTime: {
          maximumEconomy: number;
          wicketRequirement: string;
        };
        underperforming: {
          economyThreshold: number;
          consequences: string;
        };
      };
    };
  };
}

interface TeamConfigContextType {
  teamConfig: TeamConfig | null;
  setTeamConfig: (config: TeamConfig | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const TeamConfigContext = createContext<TeamConfigContextType | undefined>(undefined);

export const TeamConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <TeamConfigContext.Provider
      value={{
        teamConfig,
        setTeamConfig,
        isLoading,
        setIsLoading,
        error,
        setError,
      }}
    >
      {children}
    </TeamConfigContext.Provider>
  );
};

export const useTeamConfig = () => {
  const context = useContext(TeamConfigContext);
  if (context === undefined) {
    throw new Error("useTeamConfig must be used within a TeamConfigProvider");
  }
  return context;
};

export type { TeamConfig, BattingOrderPlayer, Benchmark, TeamRule }; 