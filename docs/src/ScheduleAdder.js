import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import ContentRemove from 'material-ui/svg-icons/content/remove'
import Snackbar from 'material-ui/Snackbar'
import * as TriggerCron from '../../packages/trigger-cron/'
import * as TriggerRrule from '../../packages/trigger-rrule/'

import './ScheduleAdder.css'
export default class ScheduleAdder extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  setName (value) {
    this.setState(Object.assign({}, this.state, { name: value }))
  }
  setPattern (value) {
    this.setState(Object.assign({}, this.state, { pattern: value }))
  }
  setFrequency (frequency) {
    this.setState(Object.assign({}, this.state, { frequency }))
  }
  getError () {
    const { name, frequency, pattern } = this.state
    if (!name) return 'Give it a name!'
    if (!frequency) return 'Slap a frequency on it!'
    if (!pattern) return 'Don\'t forget a pattern!'
    try {
      this.getTrigger(frequency, pattern)
    } catch (err) {
      return 'Your pattern is invalid!'
    }
  }
  getTrigger (frequency, pattern) {
    switch (frequency) {
      case 'rrule':
        return new TriggerRrule({ rrule: pattern })
      case 'cron':
        return new TriggerCron({ cron: pattern })
      default:
        throw new Error('no supporting trigger')
    }
  }
  onAdd () {
    // const { ...rest } = this.props
    var errorMessage = this.getError()
    if (errorMessage) return this.setState({ ...this.state, ...{ errorMessage } })
    var schedule = {
      id: this.state.name,
      trigger: this.getTrigger(this.state.frequency, this.state.pattern)
    }
    this.props.onAdd(schedule)
  }
  render () {
    let { name, frequency, pattern } = this.state
    const schedule = this.props.schedule || this.state.schedule || {}
    if (schedule.trigger) {
      pattern = schedule.trigger.toString()
      if (schedule.trigger.constructor.name.match(/rrule/i)) frequency = 'rrule'
      else if (schedule.trigger.constructor.name.match(/cron/i)) frequency = 'cron'
    }
    const Button = this.props.remove ? ContentRemove : ContentAdd
    const disabled = !!this.props.remove
    const onClick = this.props.unremovable
      ? () => {}
      : (this.props.remove ? this.props.onRemove : () => this.onAdd())
    return (
      <div className='scheduler__adder'>
        <TextField autoFocus={this.props.autoFocus} onChange={(a, value) => this.setName(value)} disabled={disabled} hintText='Name' value={schedule.id || name || ''} />
        <SelectField onChange={(a, b, value) => this.setFrequency(value)} disabled={disabled} floatingLabelText='Frequency' value={frequency}>
          <MenuItem value='cron' primaryText='CRON' />
          <MenuItem value='rrule' primaryText='RRULE' />
        </SelectField>
        <TextField onChange={(a, value) => this.setPattern(value)} disabled={disabled} hintText='Add pattern' value={pattern || ''} />
        <FloatingActionButton disabled={!!this.props.unremovable} secondary={this.props.remove}>
          <Button disabled={!!this.props.unremovable} onClick={onClick} />
        </FloatingActionButton>
        <Snackbar
          open={!!this.state.errorMessage}
          message={this.state.errorMessage || ''}
          autoHideDuration={4000}
          onRequestClose={() => this.setState({ ...this.state, ...{ errorMessage: null } })}
        />
      </div>
    )
  }
}
