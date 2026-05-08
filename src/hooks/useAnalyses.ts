import { useState } from 'react';

import { getAnalyses, saveAnalyses } from '@utils/storage';
import type { Analysis } from '@appTypes';

export const useAnalyses = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>(getAnalyses)

  const persist = (updatedList: Analysis[]) => {
    setAnalyses(updatedList)
    saveAnalyses(updatedList)
  }

  const saveAnalysis = (newEntry: Analysis) => {
    const existingIndex = analyses.findIndex((item) => item.ticker === newEntry.ticker)
    const updatedList =
      existingIndex >= 0
        ? analyses.map((item, index) => (index === existingIndex ? newEntry : item))
        : [...analyses, newEntry]
    persist(updatedList)
  }

  const deleteAnalysis = (tickerToDelete: string) => {
    persist(analyses.filter((item) => item.ticker !== tickerToDelete))
  }

  const updateCurrentPrice = (ticker: string, newPrice: string) => {
    persist(analyses.map((item) => (item.ticker === ticker ? { ...item, currentPrice: newPrice } : item)))
  }

  const importAnalyses = (importedList: Analysis[]) => {
    const mergedList = [...analyses]
    importedList.forEach((entry) => {
      if (!entry.ticker) return
      const existingIndex = mergedList.findIndex((item) => item.ticker === entry.ticker)
      if (existingIndex >= 0) mergedList[existingIndex] = entry
      else mergedList.push(entry)
    })
    persist(mergedList)
  }

  return { analyses, saveAnalysis, deleteAnalysis, updateCurrentPrice, importAnalyses }
}
