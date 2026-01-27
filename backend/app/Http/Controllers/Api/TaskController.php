<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTaskRequest;
use App\Http\Requests\Api\UpdateTaskRequest;
use App\Enums\TaskStatusEnum;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Task::query()
            ->forUser($request->user())
            ->latest()
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();

        $data['user_id'] = $request->user()->id;
        $data['status'] = $data['status'] ?? TaskStatusEnum::Pending->value;

        $task = Task::create($data);

        return response()->json($task, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        return Task::query()
            ->forUser($request->user())
            ->findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTaskRequest $request, string $id)
    {
        $task = Task::query()
            ->forUser($request->user())
            ->findOrFail($id);

        $data = $request->validated();

        $task->update($data);

        return $task;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $task = Task::query()
            ->forUser($request->user())
            ->findOrFail($id);

        $task->delete();

        return response()->noContent();
    }
}
