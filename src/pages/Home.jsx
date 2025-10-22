import React from 'react'
import { Layout } from 'antd'
import Header from '../components/Layout/Header'
import Sidebar from '../components/Layout/Sidebar'
import WorkArea from '../components/Layout/WorkArea'
import ResultPanel from '../components/Layout/ResultPanel'

const { Content } = Layout

const Home = () => {
  return (
    <Layout className="app-layout">
      <Header />
      <Content>
        <div className="main-content">
          <Sidebar />
          <WorkArea />
          <ResultPanel />
        </div>
      </Content>
    </Layout>
  )
}

export default Home