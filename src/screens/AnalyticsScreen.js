import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LineChart, PieChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'
import { loadHistory } from '../utils/storage'
import { useHistoryStore } from '../store/historyStore'
import MapView, { Marker } from 'react-native-maps'
import InsightCard from '../components/InsightCard'

const screenWidth = Dimensions.get('window').width

export default function AnalyticsScreen() {
  const history = useHistoryStore(state => state.history)
  const [period, setPeriod] = useState(7)
  const [tag, setTag] = useState('all')
  const [data, setData] = useState({ dates: [], counts: [] })
  const [typeData, setTypeData] = useState([])
  const [locations, setLocations] = useState([])
  const [insights, setInsights] = useState([])
  const [hours, setHours] = useState([])
  const [days, setDays] = useState([])
  const [percentile, setPercentile] = useState(0)

  useEffect(() => {
    const from = Date.now() - period * 86400000
    const filtered = history
      .filter(h => new Date(h.date).getTime() >= from)
      .filter(h => tag === 'all' || h.tags?.includes(tag))
    const map = new Map()
    const typeCounts = {}
    const locs = []
    const hourCounts = Array(24).fill(0)
    const dayCounts = [0,0,0,0,0,0,0]
    filtered.forEach(h => {
      const day = new Date(h.date).toLocaleDateString()
      map.set(day, (map.get(day) || 0) + 1)
      h.tags?.forEach(t => {
        typeCounts[t] = (typeCounts[t] || 0) + 1
      })
      if (h.location) locs.push(h.location)
      const date = new Date(h.date)
      hourCounts[date.getHours()]++
      dayCounts[date.getDay()]++
    })
    setData({
      dates: Array.from(map.keys()),
      counts: Array.from(map.values()),
    })
    setTypeData(Object.keys(typeCounts).map(k => ({ name: k, count: typeCounts[k], color: '#0055AA' })))
    setLocations(locs)
    setHours(hourCounts)
    setDays(dayCounts)

    const prevFrom = from - period * 86400000
    const prevCount = history.filter(h => new Date(h.date).getTime() >= prevFrom && new Date(h.date).getTime() < from).length
    const diff = filtered.length - prevCount
    const pct = prevCount ? Math.round((diff / prevCount) * 100) : 100
    const allCounts = history.length
    const myPercentile = allCounts ? Math.round((filtered.length / allCounts) * 100) : 0
    setPercentile(myPercentile)
    const bestHour = hourCounts.indexOf(Math.max(...hourCounts))
    const bestDay = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dayCounts.indexOf(Math.max(...dayCounts))]
    setInsights([
      { icon: pct >= 0 ? '🔼' : '🔽', color: pct >=0 ? 'green':'red', text: `Actividad ${pct>=0? 'aumentó':'disminuyó'} ${Math.abs(pct)}%` },
      { icon: '⏰', color: '#0055AA', text: `Mejor hora: ${bestHour}:00` },
      { icon: '🗓️', color: '#0055AA', text: `Día con más scans: ${bestDay}` },
      { icon: '🏆', color: '#FF8800', text: `Top ${100 - myPercentile}% de usuarios` },
    ])
  }, [history, period, tag])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.filters}>
        {[7, 30, 90].map(p => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={styles.filterBtn}>
            <Text style={{ color: period === p ? '#FF8800' : '#0055AA' }}>{p}d</Text>
          </TouchableOpacity>
        ))}
        {['all', 'url', 'product', 'text'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTag(t)} style={styles.filterBtn}>
            <Text style={{ color: tag === t ? '#FF8800' : '#0055AA' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {insights.length > 0 ? insights.map((ins, idx) => (
        <InsightCard key={idx} icon={ins.icon} color={ins.color} text={ins.text} />
      )) : (
        <Text style={{ marginVertical: 20 }}>Sin datos esta semana. ¡Empieza a escanear!</Text>
      )}
      <Text style={styles.title}>Últimos {period} días</Text>
      {data.dates.length > 0 && (
        <LineChart
          data={{ labels: data.dates, datasets: [{ data: data.counts }] }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{ color: () => '#0055AA' }}
        />
      )}
      {typeData.length > 0 && (
        <PieChart
          data={typeData.map(d => ({
            name: d.name,
            population: d.count,
            color: d.color,
            legendFontColor: '#333',
            legendFontSize: 12,
          }))}
          width={screenWidth - 40}
          height={200}
          accessor={'population'}
          paddingLeft={'15'}
        />
      )}
      {hours.length > 0 && (
        <LineChart
          data={{ labels: hours.map((_,i)=>i.toString()), datasets:[{data: hours}] }}
          width={screenWidth - 40}
          height={200}
          chartConfig={{ color: () => '#0055AA' }}
        />
      )}
      {locations.length > 0 && (
        <MapView style={{ width: screenWidth - 40, height: 200 }}>
          {locations.map((loc, idx) => (
            <Marker coordinate={loc} key={idx} />
          ))}
        </MapView>
      )}
      {days.length > 0 && (
        <LineChart
          data={{ labels: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'], datasets:[{data: days}] }}
          width={screenWidth - 40}
          height={200}
          chartConfig={{ color: () => '#FF8800' }}
        />
      )}
      {percentile ? (
        <InsightCard icon="🏅" color="#FF8800" text={`Percentil ${percentile}%`} />
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  filters: { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' },
  filterBtn: { marginHorizontal: 4, marginVertical: 2 },
  title: { fontSize: 18, marginBottom: 10 },
})
