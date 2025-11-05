"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

// Server performance data adapted for Minecraft servers
const chartData = [
  { date: "2024-04-01", players: 22, tps: 18.5 },
  { date: "2024-04-02", players: 31, tps: 19.2 },
  { date: "2024-04-03", players: 18, tps: 19.8 },
  { date: "2024-04-04", players: 45, tps: 17.8 },
  { date: "2024-04-05", players: 58, tps: 16.2 },
  { date: "2024-04-06", players: 42, tps: 18.9 },
  { date: "2024-04-07", players: 28, tps: 19.5 },
  { date: "2024-04-08", players: 67, tps: 15.8 },
  { date: "2024-04-09", players: 12, tps: 19.9 },
  { date: "2024-04-10", players: 35, tps: 18.7 },
  { date: "2024-04-11", players: 51, tps: 17.3 },
  { date: "2024-04-12", players: 38, tps: 18.8 },
  { date: "2024-04-13", players: 62, tps: 16.5 },
  { date: "2024-04-14", players: 25, tps: 19.3 },
  { date: "2024-04-15", players: 19, tps: 19.7 },
  { date: "2024-04-16", players: 33, tps: 18.9 },
  { date: "2024-04-17", players: 71, tps: 15.2 },
  { date: "2024-04-18", players: 55, tps: 17.1 },
  { date: "2024-04-19", players: 29, tps: 19.1 },
  { date: "2024-04-20", players: 14, tps: 19.8 },
  { date: "2024-04-21", players: 26, tps: 19.4 },
  { date: "2024-04-22", players: 37, tps: 18.6 },
  { date: "2024-04-23", players: 44, tps: 17.9 },
  { date: "2024-04-24", players: 63, tps: 16.7 },
  { date: "2024-04-25", players: 41, tps: 18.2 },
  { date: "2024-04-26", players: 16, tps: 19.6 },
  { date: "2024-04-27", players: 78, tps: 14.8 },
  { date: "2024-04-28", players: 23, tps: 19.3 },
  { date: "2024-04-29", players: 49, tps: 17.7 },
  { date: "2024-04-30", players: 85, tps: 13.9 },
  { date: "2024-05-01", players: 34, tps: 18.8 },
  { date: "2024-05-02", players: 56, tps: 17.2 },
  { date: "2024-05-03", players: 27, tps: 19.2 },
  { date: "2024-05-04", players: 73, tps: 15.1 },
  { date: "2024-05-05", players: 91, tps: 12.7 },
  { date: "2024-05-06", players: 102, tps: 11.8 },
  { date: "2024-05-07", players: 68, tps: 16.3 },
  { date: "2024-05-08", players: 21, tps: 19.5 },
  { date: "2024-05-09", players: 32, tps: 18.9 },
  { date: "2024-05-10", players: 54, tps: 17.4 },
  { date: "2024-05-11", players: 47, tps: 17.8 },
  { date: "2024-05-12", players: 29, tps: 19.1 },
  { date: "2024-05-13", players: 18, tps: 19.7 },
  { date: "2024-05-14", players: 89, tps: 13.2 },
  { date: "2024-05-15", players: 76, tps: 15.6 },
  { date: "2024-05-16", players: 59, tps: 17.0 },
  { date: "2024-05-17", players: 94, tps: 12.9 },
  { date: "2024-05-18", players: 52, tps: 17.6 },
  { date: "2024-05-19", players: 28, tps: 19.2 },
  { date: "2024-05-20", players: 31, tps: 18.8 },
  { date: "2024-05-21", players: 15, tps: 19.8 },
  { date: "2024-05-22", players: 12, tps: 19.9 },
  { date: "2024-05-23", players: 43, tps: 18.1 },
  { date: "2024-05-24", players: 38, tps: 18.5 },
  { date: "2024-05-25", players: 33, tps: 18.9 },
  { date: "2024-05-26", players: 25, tps: 19.3 },
  { date: "2024-05-27", players: 82, tps: 14.1 },
  { date: "2024-05-28", players: 36, tps: 18.7 },
  { date: "2024-05-29", players: 19, tps: 19.6 },
  { date: "2024-05-30", players: 61, tps: 16.8 },
  { date: "2024-05-31", players: 41, tps: 18.3 },
  { date: "2024-06-01", players: 37, tps: 18.6 },
  { date: "2024-06-02", players: 84, tps: 14.3 },
  { date: "2024-06-03", players: 20, tps: 19.5 },
  { date: "2024-06-04", players: 79, tps: 14.9 },
  { date: "2024-06-05", players: 16, tps: 19.7 },
  { date: "2024-06-06", players: 45, tps: 17.9 },
  { date: "2024-06-07", players: 57, tps: 17.1 },
  { date: "2024-06-08", players: 69, tps: 16.2 },
  { date: "2024-06-09", players: 93, tps: 13.1 },
  { date: "2024-06-10", players: 24, tps: 19.4 },
  { date: "2024-06-11", players: 17, tps: 19.8 },
  { date: "2024-06-12", players: 87, tps: 13.8 },
  { date: "2024-06-13", players: 13, tps: 19.9 },
  { date: "2024-06-14", players: 75, tps: 15.4 },
  { date: "2024-06-15", players: 53, tps: 17.5 },
  { date: "2024-06-16", players: 65, tps: 16.6 },
  { date: "2024-06-17", players: 98, tps: 12.3 },
  { date: "2024-06-18", players: 22, tps: 19.4 },
  { date: "2024-06-19", players: 58, tps: 17.2 },
  { date: "2024-06-20", players: 81, tps: 14.5 },
  { date: "2024-06-21", players: 30, tps: 19.0 },
  { date: "2024-06-22", players: 48, tps: 17.7 },
  { date: "2024-06-23", players: 96, tps: 12.6 },
  { date: "2024-06-24", players: 26, tps: 19.2 },
  { date: "2024-06-25", players: 35, tps: 18.8 },
  { date: "2024-06-26", players: 77, tps: 15.3 },
  { date: "2024-06-27", players: 89, tps: 13.5 },
  { date: "2024-06-28", players: 31, tps: 18.9 },
  { date: "2024-06-29", players: 18, tps: 19.7 },
  { date: "2024-06-30", players: 83, tps: 14.2 },
]

const chartConfig = {
  performance: {
    label: "Performance",
  },
  players: {
    label: "Players",
    color: "hsl(var(--chart-1))",
  },
  tps: {
    label: "TPS",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Server Performance</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Player count and TPS for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPlayers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-players)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-players)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillTps" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-tps)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-tps)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="tps"
              type="natural"
              fill="url(#fillTps)"
              stroke="var(--color-tps)"
              stackId="a"
            />
            <Area
              dataKey="players"
              type="natural"
              fill="url(#fillPlayers)"
              stroke="var(--color-players)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
