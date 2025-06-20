'use client';

import { Card, CardHeader, CardFooter, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface PreferencesCardProps {
  playerCount: string;
  setPlayerCount: (value: string) => void;
  playingTime: string;
  setPlayingTime: (value: string) => void;
  isLoading: boolean;
  makeRecommendations: () => void;
  image: string | null
}

export default function Preferences({ 
    playerCount,
    setPlayerCount,
    playingTime,
    setPlayingTime,
    isLoading,
    makeRecommendations,
    image
}: PreferencesCardProps){

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-row items-center space-x-2">
                    <Label className="w-24 text-sm">Player Count:</Label>
                    <Select value={playerCount} onValueChange={setPlayerCount}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="10+">10+</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-row items-center space-x-2">
                    <Label className="w-24 text-sm">Playing Time:</Label>
                    <Select value={playingTime} onValueChange={setPlayingTime}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Quick (< 30 mins)">{"Quick (<30 mins)"}</SelectItem>
                        <SelectItem value="Short (30-60 mins)">{"Short (30-60 mins)"}</SelectItem>
                        <SelectItem value="Medium (1-2 hours)">{"Medium (1-2 hours)"}</SelectItem>
                        <SelectItem value="Long (2-4 hours)">{"Long (2-4 hours)"}</SelectItem>
                        <SelectItem value="Super Long (4+ hours)">{"Super Long (4+ hours)"}</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full sm:w-auto" 
                    disabled={!image || isLoading}
                    onClick={makeRecommendations}
                >
                    {isLoading ? (
                    <>
                        Loading...
                        <Spinner size="small" className="ml-2 h-4 w-4 text-white" />
                    </>
                    ) : (
                    "Recommend Games"
                    )}
                </Button>
            </CardFooter>
      </Card>
    )
}