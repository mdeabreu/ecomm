import type { WorkflowHandler } from 'payload'


// Simple workflow that chains the stub tasks; will be expanded with real logic later.
export const sliceGcodeWorkflow: WorkflowHandler<'sliceGcode'> = async ({req, job, tasks }) => {

  const context = await tasks.collectSliceContext( 'collect-slice-context', {input: {gcodeId: job.input.gcodeId}} )

  const sliced = await tasks.runSlicer('run-slicer', {
    input: {
      gcodeId: job.input.gcodeId,
      ...context
    },
  })

  await tasks.parseGcode('parse-gcode', {
    input: {
      gcodeId: job.input.gcodeId,
      ...sliced
    },
  })

  const gcode = await req.payload.findByID({
    collection: 'gcodes',
    id: job.input.gcodeId,
    depth: 0,
  })

  await req.payload.update({
    collection: 'quotes',
    where: {
      id: gcode.quote.id,
    },
    data: {},
    depth: 0,
    context: {
      skipCreateQuoteGcodes: true,
    },
  })
}
